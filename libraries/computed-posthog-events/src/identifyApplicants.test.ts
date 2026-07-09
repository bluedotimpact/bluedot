import {
  courseRegistrationTable, userTable,
} from '@bluedot/db';
import {
  afterEach, describe, expect, test, vi,
} from 'vitest';
import { forwardEventTypeToPostHog } from './core';
import { eventProjectionRules } from './definitions';
import { mockPostHogBackend } from './__tests__/posthogBackend';
import { db, testDb, setupTestDb } from './__tests__/dbTestUtils';

const POSTHOG_CREDS = { host: 'https://test.posthog', apiKey: 'phc_test' };
const NOW = '2026-07-01T00:00:00.000Z';

setupTestDb();
afterEach(() => vi.unstubAllGlobals());

const identifyApplicants = eventProjectionRules.find((p) => p.eventType === 'identify_applicants')!;

const run = (opts: { since?: string } = {}) => forwardEventTypeToPostHog({
  db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: identifyApplicants, since: opts.since, now: NOW,
});

const seedRegistration = (id: string, email: string, opts: { createdAt?: string; posthogDistinctId?: string } = {}) => (
  testDb.insert(courseRegistrationTable, {
    id, courseId: 'c1', email, createdAt: opts.createdAt ?? '2026-05-01T00:00:00.000Z', posthogDistinctId: opts.posthogDistinctId,
  })
);

const seedUser = (id: string, email: string, opts: { firstLoggedInAt?: string | null } = {}) => testDb.insert(userTable, {
  id, email, name: email, firstLoggedInAt: opts.firstLoggedInAt === undefined ? '2026-05-02T00:00:00.000Z' : opts.firstLoggedInAt,
});

describe('identify_applicants', () => {
  test('a new login joins an application created before `since`', async () => {
    await seedRegistration('cr1', 'a@x.com', { createdAt: '2026-01-01T00:00:00.000Z', posthogDistinctId: 'anon-1' });
    await seedUser('u1', 'a@x.com', { firstLoggedInAt: '2026-06-01T00:00:00.000Z' });

    const ph = mockPostHogBackend();
    await run({ since: '2026-03-01T00:00:00.000Z' });

    const identify = ph.events.find((e) => e.event === '$identify')!;
    expect(identify.distinct_id).toBe('a@x.com');
    expect(identify.properties).toMatchObject({ $anon_distinct_id: 'anon-1', $set: { email: 'a@x.com' } });
  });

  test('a new application joins a user who logged in before `since`', async () => {
    await seedUser('u1', 'a@x.com', { firstLoggedInAt: '2026-01-01T00:00:00.000Z' });
    await seedRegistration('cr1', 'a@x.com', { createdAt: '2026-06-01T00:00:00.000Z', posthogDistinctId: 'anon-1' });

    const ph = mockPostHogBackend();
    await run({ since: '2026-03-01T00:00:00.000Z' });

    const identify = ph.events.find((e) => e.event === '$identify')!;
    expect(identify.distinct_id).toBe('a@x.com');
    expect(identify.properties).toMatchObject({ $anon_distinct_id: 'anon-1' });
  });

  test('anchors on the registration record id when no posthogDistinctId was captured', async () => {
    await seedRegistration('cr-norec', 'b@x.com');
    await seedUser('u1', 'b@x.com');

    const ph = mockPostHogBackend();
    await run();

    expect(ph.events.find((e) => e.event === '$identify')!.properties).toMatchObject({ $anon_distinct_id: 'cr-norec' });
  });

  test('anchors on the record id when posthogDistinctId is the email itself (legacy rows)', async () => {
    await seedRegistration('cr-legacy', 'b@x.com', { posthogDistinctId: 'b@x.com' });
    await seedUser('u1', 'b@x.com');

    const ph = mockPostHogBackend();
    await run();

    expect(ph.events.find((e) => e.event === '$identify')!.properties).toMatchObject({ $anon_distinct_id: 'cr-legacy' });
  });

  test('no-op when no user has the application email', async () => {
    await seedRegistration('cr1', 'orphan@x.com', { posthogDistinctId: 'anon-1' });

    const ph = mockPostHogBackend();
    await run();

    expect(ph.events).toHaveLength(0);
  });

  test('no-op when the matching user has never logged in', async () => {
    // user rows are created at apply time, before any login — that alone must not trigger a join
    await seedRegistration('cr1', 'a@x.com', { posthogDistinctId: 'anon-1' });
    await seedUser('u1', 'a@x.com', { firstLoggedInAt: null });

    const ph = mockPostHogBackend();
    await run();

    expect(ph.events).toHaveLength(0);
  });

  test('each application is joined at most once across runs', async () => {
    await seedRegistration('cr1', 'a@x.com', { posthogDistinctId: 'anon-1' });
    await seedUser('u1', 'a@x.com');

    mockPostHogBackend();
    expect(await run()).toMatchObject({ sent: 1 });

    const ph2 = mockPostHogBackend();
    expect(await run()).toMatchObject({ sent: 0, alreadySent: 1 });
    expect(ph2.events).toHaveLength(0);
  });

  test('earliest login wins when multiple users share an email (case-insensitively)', async () => {
    await seedRegistration('cr1', 'shared@x.com', { posthogDistinctId: 'anon-1' });
    await seedUser('u-late', 'shared@x.com', { firstLoggedInAt: '2026-06-01T00:00:00.000Z' });
    await seedUser('u-early', 'Shared@X.com', { firstLoggedInAt: '2026-04-01T00:00:00.000Z' });

    const ph = mockPostHogBackend();
    await run();

    const identifies = ph.events.filter((e) => e.event === '$identify');
    expect(identifies).toHaveLength(1);
    expect(identifies[0]!.distinct_id).toBe('Shared@X.com');
  });
});
