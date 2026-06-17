import {
  createTestDbClients, PgAirtableDb, pushTestSchema, resetTestDb,
  courseRegistrationTable, selfServeCourseRegistrationTable, eq,
} from '@bluedot/db';
import {
  afterEach, beforeAll, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { forwardEventTypeToPostHog, type PosthogEvent } from './core';
import { eventProjectionRules } from './definitions';

const POSTHOG_CREDS = { host: 'https://test.posthog', apiKey: 'phc_test' };

let db: PgAirtableDb;

beforeAll(async () => {
  const { pgClient, airtableClient } = createTestDbClients();
  db = new PgAirtableDb({
    pgConnString: 'unused', airtableApiKey: 'unused', pgClient, airtableClient,
  });
  await pushTestSchema(db);
});
beforeEach(async () => resetTestDb(db));
afterEach(() => vi.unstubAllGlobals());

// Stub global fetch to record every event sent to PostHog's /batch.
function makeFakePosthog() {
  const events: PosthogEvent[] = [];
  vi.stubGlobal('fetch', async (_url: string, init: { body: string }) => {
    events.push(...JSON.parse(init.body).batch);
    return new Response(JSON.stringify({ status: 'Ok' }), { status: 200 });
  });
  return { events };
}

// Run every projection, the way the cron loops them.
const runAll = async (opts: { since?: string; now?: string } = {}) => {
  const now = opts.now ?? '2026-07-01T00:00:00.000Z';
  for (const projection of eventProjectionRules) {
    // eslint-disable-next-line no-await-in-loop
    await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, since: opts.since, now,
    });
  }
};

// Run a single projection by event name and return its result (for asserting per-event stats).
const runOne = (event: string, opts: { since?: string; now?: string } = {}) => forwardEventTypeToPostHog({
  db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: eventProjectionRules.find((p) => p.eventType === event)!, since: opts.since, now: opts.now ?? '2026-07-01T00:00:00.000Z',
});
const eventsOf = (events: PosthogEvent[], name: string) => events.filter((e) => e.event === name);

describe('certificate_issued (two source tables)', () => {
  test('emits from both courseRegistration and selfServe, namespaced; skips rows without a cert', async () => {
    await db.pg.insert(courseRegistrationTable.pg).values([
      {
        id: 'cr1', courseId: 'c1', email: 'a@x.com', certificateId: 'cert1', certificateCreatedAt: 1_700_000_000, roundId: 'rd1',
      },
      { id: 'cr2', courseId: 'c1', email: 'b@x.com' }, // no cert -> not loaded
      {
        id: 'cr3', courseId: 'c1', email: 'd@x.com', certificateCreatedAt: 1_700_000_500,
      }, // cert timestamp but no certificateId -> loaded, but toEvents returns []
    ]);
    await db.pg.insert(selfServeCourseRegistrationTable.pg).values({
      id: 'ss1', courseId: 'c2', email: 'c@x.com', certificateId: 'sc1', certificateCreatedAt: 1_700_000_001,
    });

    const ph = makeFakePosthog();
    await runAll();

    const certs = eventsOf(ph.events, 'certificate_issued');
    expect(certs.map((e) => String(e.properties.certificate_id)).sort()).toEqual(['cert1', 'sc1']);
    const courseReg = certs.find((e) => e.properties.certificate_id === 'cert1')!;
    expect(courseReg.distinct_id).toBe('a@x.com');
    expect(courseReg.timestamp).toBe(new Date(1_700_000_000 * 1000).toISOString());
    expect(courseReg.properties).toMatchObject({ course: 'c1', round: 'rd1' });
    // self-serve has no round
    expect(certs.find((e) => e.properties.certificate_id === 'sc1')!.properties).not.toHaveProperty('round');
  });
});

describe('since (incremental scans)', () => {
  test('certificate_issued: only rows with certificateCreatedAt >= since (epoch seconds)', async () => {
    await db.pg.insert(courseRegistrationTable.pg).values([
      {
        id: 'old', courseId: 'c1', email: 'old@x.com', certificateId: 'cOld', certificateCreatedAt: 1_600_000_000,
      },
      {
        id: 'new', courseId: 'c1', email: 'new@x.com', certificateId: 'cNew', certificateCreatedAt: 1_700_000_000,
      },
    ]);
    const ph = makeFakePosthog();
    await runAll({ since: '2022-01-01T00:00:00.000Z' });
    expect(eventsOf(ph.events, 'certificate_issued').map((e) => e.distinct_id)).toEqual(['new@x.com']);
  });

  test('application_accepted: only rows with acceptedAt >= since (ISO text)', async () => {
    await db.pg.insert(courseRegistrationTable.pg).values([
      {
        id: 'old', courseId: 'c1', email: 'old@x.com', acceptedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'new', courseId: 'c1', email: 'new@x.com', acceptedAt: '2026-06-01T00:00:00.000Z',
      },
    ]);
    const ph = makeFakePosthog();
    await runAll({ since: '2026-03-01T00:00:00.000Z' });
    expect(eventsOf(ph.events, 'application_accepted').map((e) => e.distinct_id)).toEqual(['new@x.com']);
  });

  test('application_submitted: only rows with createdAt >= since (ISO text)', async () => {
    await db.pg.insert(courseRegistrationTable.pg).values([
      {
        id: 'old', courseId: 'c1', email: 'old@x.com', createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'new', courseId: 'c1', email: 'new@x.com', createdAt: '2026-06-01T00:00:00.000Z',
      },
    ]);
    const ph = makeFakePosthog();
    await runAll({ since: '2026-03-01T00:00:00.000Z' });
    expect(eventsOf(ph.events, 'application_submitted').map((e) => e.distinct_id)).toEqual(['new@x.com']);
  });
});

describe('application_accepted (write-once `Accepted at`)', () => {
  test('emits only for rows with an `Accepted at` timestamp', async () => {
    await db.pg.insert(courseRegistrationTable.pg).values([
      {
        id: 'a1', courseId: 'c1', email: 'acc@x.com', acceptedAt: '2026-06-01T10:00:00.000Z',
      },
      {
        id: 'a2', courseId: 'c1', email: 'rej@x.com', decision: 'Reject',
      }, // never accepted -> not loaded
      {
        id: 'a3', courseId: 'c1', email: 'pending@x.com', decision: 'Accept',
      }, // Accept but not yet stamped -> not loaded
    ]);

    const ph = makeFakePosthog();
    await runAll();

    const accepts = eventsOf(ph.events, 'application_accepted');
    expect(accepts).toHaveLength(1);
    expect(accepts[0]?.distinct_id).toBe('acc@x.com');
    expect(accepts[0]?.timestamp).toBe('2026-06-01T10:00:00.000Z');
  });

  test('the log keeps it send-once across runs, even if the source value changes', async () => {
    await db.pg.insert(courseRegistrationTable.pg).values({
      id: 'a1', courseId: 'c1', email: 'acc@x.com', acceptedAt: '2026-06-01T10:00:00.000Z',
    });

    const ph = makeFakePosthog();
    await runAll();
    expect(eventsOf(ph.events, 'application_accepted')).toHaveLength(1);

    // `Accepted at` is write-once in Airtable, but even if it somehow moved, the log prevents re-emit.
    await db.pg.update(courseRegistrationTable.pg)
      .set({ acceptedAt: '2026-06-20T12:00:00.000Z' })
      .where(eq(courseRegistrationTable.pg.id, 'a1'));

    await runAll();
    expect(eventsOf(ph.events, 'application_accepted')).toHaveLength(1);
    expect(eventsOf(ph.events, 'application_accepted')[0]?.timestamp).toBe('2026-06-01T10:00:00.000Z');
  });
});

describe('application_submitted (one per registration, accepted or not)', () => {
  test('emits at createdAt for every registration, joining the PostHog session when captured', async () => {
    await db.pg.insert(courseRegistrationTable.pg).values([
      {
        id: 'r1', courseId: 'c1', email: 'a@x.com', roundId: 'rd1', createdAt: '2026-05-01T09:00:00.000Z', posthogSessionId: 'sess-1',
      },
      {
        id: 'r2', courseId: 'c1', email: 'b@x.com', decision: 'Reject', createdAt: '2026-05-02T09:00:00.000Z',
      }, // rejected still counts as a submission; no session id captured
    ]);

    const ph = makeFakePosthog();
    const result = await runOne('application_submitted');

    const submits = eventsOf(ph.events, 'application_submitted');
    expect(result).toMatchObject({ candidates: 2, sent: 2, skipped: 0 });
    expect(submits.map((e) => e.distinct_id).sort()).toEqual(['a@x.com', 'b@x.com']);
    const withSession = submits.find((e) => e.distinct_id === 'a@x.com')!;
    expect(withSession.timestamp).toBe('2026-05-01T09:00:00.000Z');
    expect(withSession.properties).toMatchObject({ course: 'c1', round: 'rd1', $session_id: 'sess-1' });
    // no session id captured -> no $session_id property
    expect(submits.find((e) => e.distinct_id === 'b@x.com')!.properties).not.toHaveProperty('$session_id');
  });

  test('skips registrations without a createdAt', async () => {
    await db.pg.insert(courseRegistrationTable.pg).values({
      id: 'r1', courseId: 'c1', email: 'a@x.com',
    });

    const ph = makeFakePosthog();
    const result = await runOne('application_submitted');
    expect(result).toMatchObject({ candidates: 0, sent: 0 });
    expect(eventsOf(ph.events, 'application_submitted')).toHaveLength(0);
  });
});
