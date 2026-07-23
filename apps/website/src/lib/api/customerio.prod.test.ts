// @vitest-environment node
/* eslint-disable turbo/no-undeclared-env-vars */
import {
  afterAll, describe, expect, test,
} from 'vitest';
import { updateCustomerIoEmail } from './customerio';

// ============================================================================
// AGAINST-PROD validation of updateCustomerIoEmail (customer.io EU workspace).
// ============================================================================
// This is the customer.io analog of libraries/computed-posthog-events/src/__tests__/
// posthogBackend.staging.test.ts: it runs the REAL updateCustomerIoEmail against the
// production workspace to assert the ingestion semantics the in-memory fake in
// customerio.test.ts is built on (claim-in-place, silent collision drop, delete-then-retry),
// so we can catch drift. The squatter-with-message-history refusal cannot be asserted here
// (creating real history means sending mail); the mocked suite covers it.
//
// SKIPPED by default. To run it (writes to the PRODUCTION EU workspace, safety-controlled):
//   CIO_PROD_TEST=run npx vitest run customerio.prod
// with CIO_APP_API_KEY / CIO_TRACK_API_KEY present in the environment (same names the app
// uses; .env.local carries them).
//
// Safety: every profile uses an @example.com (non-deliverable) address, is created with
// unsubscribed:true, sends NO events and NO emails, and is deleted + verified-gone in
// afterAll even on failure. Expect each rename scenario to take 10-60s (real verify polling).
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

    for (const cioId of cioIds) {
      // eslint-disable-next-line no-await-in-loop
      await deleteByCioId(cioId);
    }

    await sleep(10_000);
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

    await updateCustomerIoEmail(userId, oldEmail, newEmail);

    expect(await getById(userId)).toBeNull();
    expect(await getByEmail(oldEmail)).toEqual([]);
    expect(await getByEmail(newEmail)).toEqual([]);
  }, 60_000);

  test('claim + rename: an email-only profile is claimed by id and renamed in place', async () => {
    const userId = liveUserId('claim');
    const oldEmail = liveEmail('claim-old');
    const newEmail = liveEmail('claim-new');
    await seed({ email: oldEmail }, oldEmail);
    const [seeded] = await waitFor(() => getByEmail(oldEmail), (profiles) => profiles.length === 1);
    expect(seeded).toBeDefined();

    await updateCustomerIoEmail(userId, oldEmail, newEmail);

    const renamed = await waitFor(() => getById(userId), (profile) => profile?.email === newEmail);
    expect(renamed?.email).toBe(newEmail);
    expect(renamed?.cio_id).toBe(seeded!.cio_id);
    expect(await getByEmail(oldEmail)).toEqual([]);
    expect(await getByEmail(newEmail)).toHaveLength(1);
  }, 180_000);

  test('rename-anyway: an id profile with a stale email is renamed even with no old-email profile', async () => {
    const userId = liveUserId('stale');
    const staleEmail = liveEmail('stale-current');
    const oldEmail = liveEmail('stale-old');
    const newEmail = liveEmail('stale-new');
    await seed({ id: userId }, staleEmail);
    const seeded = await waitFor(() => getById(userId), (profile) => profile?.email === staleEmail);
    expect(seeded?.email).toBe(staleEmail);
    createdEmails.push(oldEmail);

    await updateCustomerIoEmail(userId, oldEmail, newEmail);

    const renamed = await waitFor(() => getById(userId), (profile) => profile?.email === newEmail);
    expect(renamed?.email).toBe(newEmail);
    expect(renamed?.cio_id).toBe(seeded?.cio_id);
    expect(await getByEmail(staleEmail)).toEqual([]);
  }, 180_000);

  test('collision: an id-less history-less squatter on the new email is deleted and the rename retried', async () => {
    const userId = liveUserId('collision');
    const oldEmail = liveEmail('collision-old');
    const newEmail = liveEmail('collision-new');
    await seed({ id: userId }, oldEmail);
    await seed({ email: newEmail }, newEmail);
    const ours = await waitFor(() => getById(userId), (profile) => profile?.email === oldEmail);
    const [squatter] = await waitFor(() => getByEmail(newEmail), (profiles) => profiles.length === 1);
    expect(ours?.email).toBe(oldEmail);
    expect(squatter).toBeDefined();

    await updateCustomerIoEmail(userId, oldEmail, newEmail);

    const renamed = await waitFor(() => getById(userId), (profile) => profile?.email === newEmail);
    expect(renamed?.email).toBe(newEmail);
    expect(renamed?.cio_id).toBe(ours?.cio_id);
    const owners = await waitFor(() => getByEmail(newEmail), (profiles) => profiles.length === 1 && profiles[0]?.cio_id === ours?.cio_id, 120_000);
    expect(owners).toHaveLength(1);
    expect(owners[0]!.cio_id).toBe(ours?.cio_id);
  }, 240_000);
});
