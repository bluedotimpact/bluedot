import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import env from './env';
import { normaliseEmail } from './utils';

const CIO_API_BASE = 'https://api-eu.customer.io/v1';
const CIO_TRACK_V1_BASE = 'https://track-eu.customer.io/api/v1';
const CIO_TRACK_V2_BASE = 'https://track-eu.customer.io/api/v2';

const VERIFY_POLL_DELAYS_MS = [5000, 3000, 3000, 4000, 5000, 5000, 5000];

const sleep = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

type CioKeys = { appKey: string; trackKey: string };

type CioProfileSummary = { cio_id: string; id?: string | null; email?: string | null };

type CioProfile = {
  identifiers?: { cio_id?: string; id?: string | null; email?: string | null };
  attributes?: Record<string, unknown>;
};

const appHeaders = (keys: CioKeys) => ({ Authorization: `Bearer ${keys.appKey}` });

const trackHeaders = (keys: CioKeys) => ({
  Authorization: `Basic ${Buffer.from(keys.trackKey).toString('base64')}`,
  'Content-Type': 'application/json',
});

async function getProfileById(keys: CioKeys, userId: string): Promise<CioProfile | null> {
  const res = await fetch(`${CIO_API_BASE}/customers/${encodeURIComponent(userId)}/attributes?id_type=id`, { headers: appHeaders(keys) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch customer.io profile by id: HTTP ${res.status}`);
  const data = await res.json() as { customer?: CioProfile };
  return data.customer ?? null;
}

async function searchProfilesByEmail(keys: CioKeys, email: string): Promise<CioProfileSummary[]> {
  const res = await fetch(`${CIO_API_BASE}/customers?email=${encodeURIComponent(email)}`, { headers: appHeaders(keys) });
  if (!res.ok) throw new Error(`Failed to search customer.io profiles by email: HTTP ${res.status}`);
  const data = await res.json() as { results?: CioProfileSummary[] };
  return data.results ?? [];
}

async function identifyById(keys: CioKeys, userId: string, email: string): Promise<void> {
  const res = await fetch(`${CIO_TRACK_V2_BASE}/batch`, {
    method: 'POST',
    headers: trackHeaders(keys),
    body: JSON.stringify({
      batch: [{
        type: 'person',
        identifiers: { id: userId },
        action: 'identify',
        attributes: { email },
      }],
    }),
  });
  if (!res.ok) throw new Error(`customer.io identify failed: HTTP ${res.status}`);
}

const profileEmail = (profile: CioProfile | null): string | null => {
  const email = profile?.identifiers?.email ?? profile?.attributes?.email;
  return typeof email === 'string' ? normaliseEmail(email) : null;
};

async function pollUntilEmailIs(keys: CioKeys, userId: string, expectedEmail: string): Promise<boolean> {
  for (const delayMs of VERIFY_POLL_DELAYS_MS) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(delayMs);
    // eslint-disable-next-line no-await-in-loop
    const profile = await getProfileById(keys, userId);
    if (profileEmail(profile) === expectedEmail) return true;
  }

  return false;
}

async function pollForLateIdProfile(keys: CioKeys, userId: string): Promise<CioProfile | null> {
  for (const delayMs of [5000, 5000, 5000]) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(delayMs);
    // eslint-disable-next-line no-await-in-loop
    const profile = await getProfileById(keys, userId);
    if (profile) return profile;
  }

  return null;
}

async function hasMessageHistory(keys: CioKeys, cioId: string): Promise<boolean> {
  const res = await fetch(`${CIO_API_BASE}/customers/${encodeURIComponent(cioId)}/messages?id_type=cio_id&limit=1`, { headers: appHeaders(keys) });
  if (!res.ok) throw new Error(`Failed to fetch customer.io message history: HTTP ${res.status}`);
  const data = await res.json() as { messages?: unknown[] };
  return (data.messages ?? []).length > 0;
}

async function deleteProfileByCioId(keys: CioKeys, cioId: string): Promise<void> {
  const res = await fetch(`${CIO_TRACK_V1_BASE}/customers/${encodeURIComponent(`cio_${cioId}`)}`, {
    method: 'DELETE',
    headers: trackHeaders(keys),
  });
  if (!res.ok) throw new Error(`Failed to delete customer.io profile cio_${cioId}: HTTP ${res.status}`);
}

export async function updateCustomerIoEmail(userId: string, oldEmailRaw: string, newEmailRaw: string): Promise<void> {
  if (!env.CIO_APP_API_KEY || !env.CIO_TRACK_API_KEY) {
    await slackAlert(env, [`[CIO] Email update skipped for user ${userId}: customer.io API keys are not configured`]);
    return;
  }

  const keys: CioKeys = { appKey: env.CIO_APP_API_KEY, trackKey: env.CIO_TRACK_API_KEY };
  const oldEmail = normaliseEmail(oldEmailRaw);
  const newEmail = normaliseEmail(newEmailRaw);

  const idProfile = await getProfileById(keys, userId);
  if (idProfile) {
    if (profileEmail(idProfile) === newEmail) return;
  } else {
    const candidates = await searchProfilesByEmail(keys, oldEmail);
    if (candidates.length === 0) {
      const lateProfile = await pollForLateIdProfile(keys, userId);
      if (!lateProfile) return;
      if (profileEmail(lateProfile) === newEmail) return;
    } else if (candidates.length > 1) {
      await slackAlert(env, [`[CIO] Email update aborted for user ${userId}: multiple customer.io profiles own the old email`]);
      return;
    } else {
      const candidate = candidates[0]!;
      if (candidate.id && candidate.id !== userId) {
        await slackAlert(env, [`[CIO] Email update aborted for user ${userId}: the old-email profile is owned by a different user id (${candidate.id})`]);
        return;
      }

      if (!candidate.id) {
        await identifyById(keys, userId, oldEmail);
        const claimed = await pollUntilEmailIs(keys, userId, oldEmail);
        if (!claimed) {
          await slackAlert(env, [`[CIO] Email update failed for user ${userId}: claiming the old-email profile did not complete`]);
          return;
        }
      }
    }
  }

  await identifyById(keys, userId, newEmail);
  if (await pollUntilEmailIs(keys, userId, newEmail)) return;

  const newEmailProfiles = await searchProfilesByEmail(keys, newEmail);
  if (newEmailProfiles.some((profile) => profile.id === userId)) return;
  if (newEmailProfiles.length === 0) {
    await slackAlert(env, [`[CIO] Email update failed for user ${userId}: rename did not verify and no conflicting profile was found`]);
    return;
  }

  if (newEmailProfiles.length > 1) {
    await slackAlert(env, [`[CIO] Email update failed for user ${userId}: multiple customer.io profiles own the new email`]);
    return;
  }

  const squatter = newEmailProfiles[0]!;
  if (squatter.id) {
    await slackAlert(env, [`[CIO] Email update failed for user ${userId}: the new email is owned by a profile with user id ${squatter.id}`]);
    return;
  }

  if (await hasMessageHistory(keys, squatter.cio_id)) {
    await slackAlert(env, [`[CIO] Email update failed for user ${userId}: the new email is owned by a profile with message history (cio_${squatter.cio_id})`]);
    return;
  }

  await deleteProfileByCioId(keys, squatter.cio_id);
  await identifyById(keys, userId, newEmail);
  if (await pollUntilEmailIs(keys, userId, newEmail)) return;
  await slackAlert(env, [`[CIO] Email update failed for user ${userId}: rename did not verify even after deleting the conflicting profile cio_${squatter.cio_id}`]);
}

export async function sendEmailChangeVerification({ userId, newEmail, confirmUrl }: { userId: string; newEmail: string; confirmUrl: string }): Promise<void> {
  if (!env.CIO_APP_API_KEY) {
    throw new Error('customer.io App API key is not configured');
  }

  const res = await fetch(`${CIO_API_BASE}/send/email`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CIO_APP_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: normaliseEmail(newEmail),
      identifiers: { id: userId },
      from: 'BlueDot Impact <team@bluedot.org>',
      subject: 'Confirm your new email address',
      body: [
        '<p>A change of your BlueDot Impact account email to this address has been requested.</p>',
        `<p><a href="${confirmUrl}">Confirm this email address</a></p>`,
        `<p>Or copy this link into your browser: ${confirmUrl}</p>`,
        '<p>This link expires in 48 hours. If you did not expect this, you can safely ignore this email and nothing will change.</p>',
      ].join('\n'),
    }),
  });
  if (!res.ok) {
    throw new Error(`customer.io verification email send failed: HTTP ${res.status}`);
  }
}
