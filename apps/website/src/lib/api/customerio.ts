import env from './env';
import { normaliseEmail } from './utils';

export const CIO_API_BASE = 'https://api-eu.customer.io/v1';
export const CIO_TRACK_V1_BASE = 'https://track-eu.customer.io/api/v1';
const CIO_TRACK_V2_BASE = 'https://track-eu.customer.io/api/v2';

const POLL_INTERVAL_MS = 5000;
const VERIFY_POLL_ATTEMPTS = 6;

type CioProfileSummary = { cio_id: string; id?: string | null; email?: string | null };

type CioProfile = {
  identifiers?: { cio_id?: string; id?: string | null; email?: string | null };
  attributes?: Record<string, unknown>;
};

const appHeaders = () => {
  if (!env.CIO_APP_API_KEY) throw new Error('customer.io App API key is not configured');
  return { Authorization: `Bearer ${env.CIO_APP_API_KEY}` };
};

const trackHeaders = () => {
  if (!env.CIO_TRACK_API_KEY) throw new Error('customer.io Track API key is not configured');
  return {
    Authorization: `Basic ${Buffer.from(env.CIO_TRACK_API_KEY).toString('base64')}`,
    'Content-Type': 'application/json',
  };
};

async function getProfileById(userId: string): Promise<CioProfile | null> {
  const res = await fetch(`${CIO_API_BASE}/customers/${encodeURIComponent(userId)}/attributes?id_type=id`, { headers: appHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch customer.io profile by id: HTTP ${res.status}`);
  const data = await res.json() as { customer?: CioProfile };
  return data.customer ?? null;
}

async function searchProfilesByEmail(email: string): Promise<CioProfileSummary[]> {
  const res = await fetch(`${CIO_API_BASE}/customers?email=${encodeURIComponent(email)}`, { headers: appHeaders() });
  if (!res.ok) throw new Error(`Failed to search customer.io profiles by email: HTTP ${res.status}`);
  const data = await res.json() as { results?: CioProfileSummary[] };
  return data.results ?? [];
}

async function identify({ userId, email }: { userId: string; email: string }): Promise<void> {
  const res = await fetch(`${CIO_TRACK_V2_BASE}/batch`, {
    method: 'POST',
    headers: trackHeaders(),
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

async function emailIsVisible({ userId, email }: { userId: string; email: string }): Promise<boolean> {
  for (let attempt = 0; attempt < VERIFY_POLL_ATTEMPTS; attempt++) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, POLL_INTERVAL_MS);
    });
    // eslint-disable-next-line no-await-in-loop
    if (profileEmail(await getProfileById(userId)) === email) return true;
  }

  return false;
}

export async function updateCustomerIoEmail({ userId, oldEmail: oldEmailRaw, newEmail: newEmailRaw }: { userId: string; oldEmail: string; newEmail: string }): Promise<void> {
  const oldEmail = normaliseEmail(oldEmailRaw);
  const newEmail = normaliseEmail(newEmailRaw);

  const cioProfileByUserId = await getProfileById(userId);
  if (cioProfileByUserId) {
    if (profileEmail(cioProfileByUserId) === newEmail) return;
  } else {
    const cioProfilesByOldEmail = await searchProfilesByEmail(oldEmail);
    if (cioProfilesByOldEmail.length === 0) return;
    if (cioProfilesByOldEmail.length > 1) {
      throw new Error(`Email update aborted for user ${userId}: multiple customer.io profiles own the old email`);
    }

    const cioProfileByOldEmail = cioProfilesByOldEmail[0]!;
    if (cioProfileByOldEmail.id && cioProfileByOldEmail.id !== userId) {
      throw new Error(`Email update aborted for user ${userId}: the old-email profile is owned by a different user id (${cioProfileByOldEmail.id})`);
    }

    // Changing email requires setting a stable `id` for the profile, so the email itself can be mutated.
    // If the profile has no id, add one (the userId) and wait for this change to propagate.
    if (!cioProfileByOldEmail.id) {
      await identify({ userId, email: oldEmail });
      if (!(await emailIsVisible({ userId, email: oldEmail }))) {
        throw new Error(`Email update failed for user ${userId}: claiming the old-email profile did not complete`);
      }
    }
  }

  // Update the CIO profile with the new email, and wait for it to propagate
  await identify({ userId, email: newEmail });
  if (await emailIsVisible({ userId, email: newEmail })) return;

  const newEmailProfiles = await searchProfilesByEmail(newEmail);
  if (newEmailProfiles.some((profile) => profile.id === userId)) return;
  if (newEmailProfiles.length === 0) {
    throw new Error(`Email update failed for user ${userId}: rename did not verify and no conflicting profile was found`);
  }

  const owners = newEmailProfiles.map((profile) => (profile.id ? `cio_${profile.cio_id} (user id ${profile.id})` : `cio_${profile.cio_id}`)).join(', ');
  throw new Error(`Email update failed for user ${userId}: the new email is already owned by ${owners}`);
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export async function sendEmailChangeVerification({ oldEmail, newEmail, confirmUrl }: { oldEmail: string; newEmail: string; confirmUrl: string }): Promise<void> {
  const safeConfirmUrl = escapeHtml(confirmUrl);
  const res = await fetch(`${CIO_API_BASE}/send/email`, {
    method: 'POST',
    headers: { ...appHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // Important: Use oldEmail as the identifier (correct until they click through in the email to
      // accept the new one, and prevents an orphaned profile from being created), but send *to* the new email
      to: normaliseEmail(newEmail),
      identifiers: { email: normaliseEmail(oldEmail) },
      send_to_unsubscribed: true,
      from: 'BlueDot Impact <team@bluedot.org>',
      subject: 'Confirm your new email address',
      body: [
        '<p>A change of your BlueDot Impact account email to this address has been requested.</p>',
        `<p><a href="${safeConfirmUrl}">Confirm this email address</a></p>`,
        `<p>Or copy this link into your browser: ${safeConfirmUrl}</p>`,
        '<p>This link expires in 48 hours. If you did not expect this, you can safely ignore this email and nothing will change.</p>',
      ].join('\n'),
    }),
  });
  if (!res.ok) {
    throw new Error(`customer.io verification email send failed: HTTP ${res.status}`);
  }
}
