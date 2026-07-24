// @vitest-environment node
/* eslint-disable turbo/no-undeclared-env-vars */
import {
  afterAll, describe, expect, test,
} from 'vitest';
import { sendEmailChangeVerification, updateCustomerIoEmail } from './customerio';

// ============================================================================
// AGAINST-PROD validation of the customer.io email-change lib (EU workspace).
// ============================================================================
// This is the customer.io analog of libraries/computed-posthog-events/src/__tests__/
// posthogBackend.staging.test.ts: it runs the REAL sendEmailChangeVerification and
// updateCustomerIoEmail against the production workspace to assert the ingestion semantics
// the in-memory fake in customerio.test.ts is built on, so we can catch drift. Scenarios:
//  - skip: no id profile and no old-email profile → no writes at all;
//  - verification-send keying + claim (finding-5 regression): the transactional send keyed
//    by the old-email identifier attaches to the existing old-email profile — creating NO
//    profile for the new address and NO id-keyed profile — and the subsequent
//    updateCustomerIoEmail claims that same profile (same cio_id) and renames it in place;
//  - rename-anyway: an id-keyed profile with a stale email is renamed even with no
//    old-email profile;
//  - collision: a profile owning the new email is left untouched and surfaced as an error.
//
// SKIPPED by default. To run it (writes to the PRODUCTION EU workspace, safety-controlled):
//   CIO_PROD_TEST=run npx vitest run customerio.prod
// with CIO_APP_API_KEY / CIO_TRACK_API_KEY present in the environment (same names the app
// uses; .env.local carries them).
//
// Safety: every profile uses an @example.com (non-deliverable) address and is created with
// unsubscribed:true. The finding-5 scenario sends ONE real transactional email, addressed to
// an @example.com recipient (example.com has no MX; the send bounces without delivery). All
// profiles are deleted + verified-gone in afterAll even on failure, with a second delete pass
// because identifies still in customer.io's async pipeline can resurrect a just-deleted
// profile. Expect each rename scenario to take 10-60s (real verify polling).
//
// This file is preserved on the `wh-2810-cio-livetest-2026-07-archive` branch and is not
// part of the shipped codebase.

const RUN = process.env.CIO_PROD_TEST === 'run' && !!process.env.CIO_APP_API_KEY && !!process.env.CIO_TRACK_API_KEY;

const APP = 'https://api-eu.customer.io/v1';
const TRACK = 'https://track-eu.customer.io/api/v2';
const TRACK_V1 = 'https://track-eu.customer.io/api/v1';
const appAuth = `Bearer ${process.env.CIO_APP_API_KEY ?? ''}`;
const trackAuth = `Basic ${Buffer.from(process.env.CIO_TRACK_API_KEY ?? '').toString('base64')}`;

const suffix = Math.random().toString(16).slice(2, 8);
const liveEmail = (label: string) => `e2e-2810-live-${label}-${suffix}@example.com`;
const liveUserId = (label: string) => `e2e-2810-live-user-${label}-${suffix}`;

const createdEmails: string[] = [];
const createdUserIds: string[] = [];

const sleep = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

async function seed(identifiers: { id?: string; email?: string }, email: string) {
  if (identifiers.id) createdUserIds.push(identifiers.id);
  createdEmails.push(email);
  const res = await fetch(`${TRACK}/batch`, {
    method: 'POST',
    headers: { Authorization: trackAuth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      batch: [{
        type: 'person',
        identifiers,
        action: 'identify',
        attributes: { email, unsubscribed: true },
      }],
    }),
  });
  expect(res.ok).toBe(true);
}

async function getByEmail(email: string): Promise<{ cio_id: string; id?: string | null }[]> {
  const res = await fetch(`${APP}/customers?email=${encodeURIComponent(email)}`, { headers: { Authorization: appAuth } });
  expect(res.ok).toBe(true);
  const data = await res.json() as { results?: { cio_id: string; id?: string | null }[] };
  return data.results ?? [];
}

async function getById(userId: string): Promise<{ cio_id?: string; email?: string } | null> {
  const res = await fetch(`${APP}/customers/${encodeURIComponent(userId)}/attributes?id_type=id`, { headers: { Authorization: appAuth } });
  if (res.status === 404) return null;
  expect(res.ok).toBe(true);
  const data = await res.json() as { customer?: { identifiers?: { cio_id?: string; email?: string }; attributes?: { email?: string } } };
  return {
    cio_id: data.customer?.identifiers?.cio_id,
    email: data.customer?.identifiers?.email ?? data.customer?.attributes?.email,
  };
}

async function getMessages(cioId: string): Promise<{ recipient?: string; subject?: string }[]> {
  const res = await fetch(`${APP}/customers/${encodeURIComponent(cioId)}/messages?id_type=cio_id`, { headers: { Authorization: appAuth } });
  if (res.status === 404) return [];
  expect(res.ok).toBe(true);
  const data = await res.json() as { messages?: { recipient?: string; subject?: string }[] };
  return data.messages ?? [];
}

async function waitFor<T>(fn: () => Promise<T>, check: (value: T) => boolean, timeoutMs = 60_000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const value = await fn();
    if (check(value)) return value;
    if (Date.now() > deadline) return value;
    // eslint-disable-next-line no-await-in-loop
    await sleep(3000);
  }
}

async function deleteByCioId(cioId: string) {
  await fetch(`${TRACK_V1}/customers/${encodeURIComponent(`cio_${cioId}`)}`, {
    method: 'DELETE',
    headers: { Authorization: trackAuth, 'Content-Type': 'application/json' },
  });
}

describe.runIf(RUN)('updateCustomerIoEmail against the production EU workspace', () => {
  afterAll(async () => {
    const collectCioIds = async () => {
      const cioIds = new Set<string>();
      for (const email of createdEmails) {
        // eslint-disable-next-line no-await-in-loop
        for (const profile of await getByEmail(email)) cioIds.add(profile.cio_id);
      }

      for (const userId of createdUserIds) {
        // eslint-disable-next-line no-await-in-loop
        const profile = await getById(userId);
        if (profile?.cio_id) cioIds.add(profile.cio_id);
      }

      return cioIds;
    };

    for (const cioId of await collectCioIds()) {
      // eslint-disable-next-line no-await-in-loop
      await deleteByCioId(cioId);
    }

    await sleep(30_000);
    const resurrected = await collectCioIds();
    for (const cioId of resurrected) {
      // eslint-disable-next-line no-await-in-loop
      await deleteByCioId(cioId);
    }

    if (resurrected.size > 0) await sleep(15_000);
    for (const email of createdEmails) {
      // eslint-disable-next-line no-await-in-loop
      expect(await getByEmail(email)).toEqual([]);
    }

    for (const userId of createdUserIds) {
      // eslint-disable-next-line no-await-in-loop
      expect(await getById(userId)).toBeNull();
    }
  }, 180_000);

  test('skip: no id profile and no old-email profile creates nothing', async () => {
    const userId = liveUserId('skip');
    const oldEmail = liveEmail('skip-old');
    const newEmail = liveEmail('skip-new');
    createdUserIds.push(userId);
    createdEmails.push(oldEmail, newEmail);

    await updateCustomerIoEmail({ userId, oldEmail, newEmail });

    expect(await getById(userId)).toBeNull();
    expect(await getByEmail(oldEmail)).toEqual([]);
    expect(await getByEmail(newEmail)).toEqual([]);
  }, 60_000);

  test('verification send + claim + rename: the send attaches to the old-email profile, which is then claimed and renamed in place', async () => {
    const userId = liveUserId('claim');
    const oldEmail = liveEmail('claim-old');
    const newEmail = liveEmail('claim-new');
    createdUserIds.push(userId);
    await seed({ email: oldEmail }, oldEmail);
    createdEmails.push(newEmail);
    const [seeded] = await waitFor(() => getByEmail(oldEmail), (profiles) => profiles.length === 1);
    expect(seeded).toBeDefined();

    await sendEmailChangeVerification({ oldEmail, newEmail, confirmUrl: 'https://bluedot.org/account?probe=e2e-2810' });

    const messages = await waitFor(
      () => getMessages(seeded!.cio_id),
      (msgs) => msgs.some((m) => m.recipient === newEmail),
      120_000,
    );
    expect(messages.some((m) => m.recipient === newEmail)).toBe(true);
    expect(await getByEmail(newEmail)).toEqual([]);
    expect(await getById(userId)).toBeNull();
    expect(await getByEmail(oldEmail)).toHaveLength(1);

    await updateCustomerIoEmail({ userId, oldEmail, newEmail });

    const renamed = await waitFor(() => getById(userId), (profile) => profile?.email === newEmail);
    expect(renamed?.email).toBe(newEmail);
    expect(renamed?.cio_id).toBe(seeded!.cio_id);
    expect(await getByEmail(oldEmail)).toEqual([]);
    expect(await getByEmail(newEmail)).toHaveLength(1);
  }, 360_000);

  test('rename-anyway: an id profile with a stale email is renamed even with no old-email profile', async () => {
    const userId = liveUserId('stale');
    const staleEmail = liveEmail('stale-current');
    const oldEmail = liveEmail('stale-old');
    const newEmail = liveEmail('stale-new');
    await seed({ id: userId }, staleEmail);
    const seeded = await waitFor(() => getById(userId), (profile) => profile?.email === staleEmail);
    expect(seeded?.email).toBe(staleEmail);
    createdEmails.push(oldEmail);

    await updateCustomerIoEmail({ userId, oldEmail, newEmail });

    const renamed = await waitFor(() => getById(userId), (profile) => profile?.email === newEmail);
    expect(renamed?.email).toBe(newEmail);
    expect(renamed?.cio_id).toBe(seeded?.cio_id);
    expect(await getByEmail(staleEmail)).toEqual([]);
  }, 180_000);

  test('collision: a profile owning the new email is left untouched and surfaced as an error', async () => {
    const userId = liveUserId('collision');
    const oldEmail = liveEmail('collision-old');
    const newEmail = liveEmail('collision-new');
    await seed({ id: userId }, oldEmail);
    await seed({ email: newEmail }, newEmail);
    const ours = await waitFor(() => getById(userId), (profile) => profile?.email === oldEmail);
    const [squatter] = await waitFor(() => getByEmail(newEmail), (profiles) => profiles.length === 1);
    expect(ours?.email).toBe(oldEmail);
    expect(squatter).toBeDefined();

    await expect(updateCustomerIoEmail({ userId, oldEmail, newEmail }))
      .rejects.toThrow(`already owned by cio_${squatter!.cio_id}`);

    const mine = await getById(userId);
    expect(mine?.email).toBe(oldEmail);
    expect(mine?.cio_id).toBe(ours?.cio_id);
    const owners = await getByEmail(newEmail);
    expect(owners).toHaveLength(1);
    expect(owners[0]!.cio_id).toBe(squatter!.cio_id);
  }, 240_000);
});
