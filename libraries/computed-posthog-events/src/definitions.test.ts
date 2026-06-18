import {
  courseRegistrationTable, selfServeCourseRegistrationTable, courseTable, eq,
} from '@bluedot/db';
import {
  afterEach, describe, expect, test, vi,
} from 'vitest';
import { forwardEventTypeToPostHog, type PostHogEvent } from './core';
import { eventProjectionRules } from './definitions';
import { installPosthogBackend } from './__tests__/posthogBackend';
import { db, testDb, setupTestDb } from './__tests__/dbTestUtils';

const POSTHOG_CREDS = { host: 'https://test.posthog', apiKey: 'phc_test' };

setupTestDb();
afterEach(() => vi.unstubAllGlobals());

// Post a raw batch straight to the (stubbed) backend — used to model prior anonymous browsing.
const sendRaw = (batch: PostHogEvent[]) => fetch('https://test.posthog/batch/', {
  method: 'POST',
  body: JSON.stringify({ historical_migration: false, batch }),
});

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
const eventsOf = (events: PostHogEvent[], name: string) => events.filter((e) => e.event === name);
const batchWith = (ph: ReturnType<typeof installPosthogBackend>, name: string) => ph.receivedBatches.find((b) => b.events.some((e) => e.event === name));

describe('certificate_issued (two source tables)', () => {
  test('emits from both courseRegistration and selfServe, namespaced; skips rows without a cert', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'cr1', courseId: 'c1', email: 'a@x.com', certificateId: 'cert1', certificateCreatedAt: 1_700_000_000, roundId: 'rd1',
    });
    await testDb.insert(courseRegistrationTable, { id: 'cr2', courseId: 'c1', email: 'b@x.com' }); // no cert -> not loaded
    await testDb.insert(courseRegistrationTable, {
      id: 'cr3', courseId: 'c1', email: 'd@x.com', certificateCreatedAt: 1_700_000_500,
    }); // cert timestamp but no certificateId -> loaded, but emits nothing
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss1', courseId: 'c2', email: 'c@x.com', certificateId: 'sc1', certificateCreatedAt: 1_700_000_001,
    });

    const ph = installPosthogBackend();
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
    await testDb.insert(courseRegistrationTable, {
      id: 'old', courseId: 'c1', email: 'old@x.com', certificateId: 'cOld', certificateCreatedAt: 1_600_000_000,
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'new', courseId: 'c1', email: 'new@x.com', certificateId: 'cNew', certificateCreatedAt: 1_700_000_000,
    });
    const ph = installPosthogBackend();
    await runAll({ since: '2022-01-01T00:00:00.000Z' });
    expect(eventsOf(ph.events, 'certificate_issued').map((e) => e.distinct_id)).toEqual(['new@x.com']);
  });

  test('application_accepted: only rows with acceptedAt >= since (ISO text)', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'old', courseId: 'c1', email: 'old@x.com', acceptedAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'new', courseId: 'c1', email: 'new@x.com', acceptedAt: '2026-06-01T00:00:00.000Z',
    });
    const ph = installPosthogBackend();
    await runAll({ since: '2026-03-01T00:00:00.000Z' });
    expect(eventsOf(ph.events, 'application_accepted').map((e) => e.distinct_id)).toEqual(['new@x.com']);
  });

  test('application_submitted: only rows with createdAt >= since (ISO text)', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'old', courseId: 'c1', email: 'old@x.com', createdAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'new', courseId: 'c1', email: 'new@x.com', createdAt: '2026-06-01T00:00:00.000Z',
    });
    const ph = installPosthogBackend();
    await runAll({ since: '2026-03-01T00:00:00.000Z' });
    expect(eventsOf(ph.events, 'application_submitted').map((e) => e.distinct_id)).toEqual(['new@x.com']);
  });
});

describe('application_accepted (write-once `Accepted at`)', () => {
  test('emits only for rows with an `Accepted at` timestamp', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'a1', courseId: 'c1', email: 'acc@x.com', acceptedAt: '2026-06-01T10:00:00.000Z',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'a2', courseId: 'c1', email: 'rej@x.com', decision: 'Reject',
    }); // never accepted -> not loaded
    await testDb.insert(courseRegistrationTable, {
      id: 'a3', courseId: 'c1', email: 'pending@x.com', decision: 'Accept',
    }); // Accept but not yet stamped -> not loaded

    const ph = installPosthogBackend();
    await runAll();

    const accepts = eventsOf(ph.events, 'application_accepted');
    expect(accepts).toHaveLength(1);
    expect(accepts[0]?.distinct_id).toBe('acc@x.com');
    expect(accepts[0]?.timestamp).toBe('2026-06-01T10:00:00.000Z');
  });

  test('the log keeps it send-once across runs, even if the source value changes', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'a1', courseId: 'c1', email: 'acc@x.com', acceptedAt: '2026-06-01T10:00:00.000Z',
    });

    const ph = installPosthogBackend();
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
    await testDb.insert(courseRegistrationTable, {
      id: 'r1', courseId: 'c1', email: 'a@x.com', roundId: 'rd1', createdAt: '2026-05-01T09:00:00.000Z', posthogSessionId: 'sess-1',
    });
    // rejected still counts as a submission; no session id captured
    await testDb.insert(courseRegistrationTable, {
      id: 'r2', courseId: 'c1', email: 'b@x.com', decision: 'Reject', createdAt: '2026-05-02T09:00:00.000Z',
    });

    const ph = installPosthogBackend();
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
    await testDb.insert(courseRegistrationTable, { id: 'r1', courseId: 'c1', email: 'a@x.com' });

    const ph = installPosthogBackend();
    const result = await runOne('application_submitted');
    expect(result).toMatchObject({ candidates: 0, sent: 0 });
    expect(eventsOf(ph.events, 'application_submitted')).toHaveLength(0);
  });

  test('reports the readable course title (from courseTable) and round name', async () => {
    await testDb.insert(courseTable, {
      id: 'c1', slug: 'agi-strategy', shortDescription: 'x', title: 'AGI Strategy', units: [],
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'r1', courseId: 'c1', email: 'a@x.com', createdAt: '2026-05-01T09:00:00.000Z', roundName: 'AGI Strategy (2026 Mar W12) - Part-time',
    });

    const ph = installPosthogBackend();
    await runOne('application_submitted');

    expect(eventsOf(ph.events, 'application_submitted')[0]?.properties)
      .toMatchObject({ course: 'AGI Strategy', round: 'AGI Strategy (2026 Mar W12) - Part-time' });
  });

  // When the form captured the applicant's anonymous PostHog id, application_submitted also emits an
  // `$identify` that merges that anonymous person into the email person. Exercised end-to-end against
  // the in-memory model of PostHog (the same model the staging check validates).
  describe('identify (merge anonymous browsing into the email person)', () => {
    test('merges the captured anonymous id into the email person; the submitted event lands on the merged person', async () => {
      await testDb.insert(courseRegistrationTable, {
        id: 'r1', courseId: 'c1', email: 'a@x.com', createdAt: '2026-05-01T09:00:00.000Z', posthogDistinctId: 'anon-1',
      });

      const ph = installPosthogBackend();
      // the applicant browsed anonymously (logged out) before applying
      await sendRaw([{
        event: '$pageview', distinct_id: 'anon-1', uuid: 'u0', timestamp: '2026-04-01T00:00:00.000Z', properties: {},
      }]);
      expect(ph.isSamePerson('anon-1', 'a@x.com')).toBe(false);

      const result = await runOne('application_submitted');

      expect(result).toMatchObject({ candidates: 2, sent: 2 }); // the identify and the submitted event
      // the anonymous browsing is now stitched to the email person, with the email set as a property
      expect(ph.isSamePerson('anon-1', 'a@x.com')).toBe(true);
      expect(ph.personPropsFor('a@x.com')).toMatchObject({ email: 'a@x.com' });
      // the $identify wire event carries the merge shape
      const identifyEvent = ph.events.find((e) => e.event === '$identify')!;
      expect(identifyEvent.distinct_id).toBe('a@x.com');
      expect(identifyEvent.properties).toMatchObject({ $anon_distinct_id: 'anon-1', $set: { email: 'a@x.com' } });
      // the submitted event resolves to the same (merged) person as the anonymous browsing
      const submitted = ph.events.find((e) => e.event === 'application_submitted')!;
      expect(ph.personIdFor(submitted.distinct_id)).toBe(ph.personIdFor('anon-1'));
    });

    test('emits no identify when no anonymous id was captured, or it is just the applicant\'s email', async () => {
      await testDb.insert(courseRegistrationTable, {
        id: 'none', courseId: 'c1', email: 'a@x.com', createdAt: '2026-05-01T09:00:00.000Z',
      });
      // a distinct id equal to the email is PII we don't forward (no merge needed anyway)
      await testDb.insert(courseRegistrationTable, {
        id: 'self', courseId: 'c1', email: 'b@x.com', createdAt: '2026-05-02T09:00:00.000Z', posthogDistinctId: 'b@x.com',
      });

      const ph = installPosthogBackend();
      const result = await runOne('application_submitted');

      expect(result).toMatchObject({ candidates: 2, sent: 2 }); // two submitted events, no identifies
      expect(eventsOf(ph.events, '$identify')).toHaveLength(0);
      expect(eventsOf(ph.events, 'application_submitted')).toHaveLength(2);
    });

    test('sends the identify live even for an old (backfilled) application, while the submitted event ships as historical', async () => {
      await testDb.insert(courseRegistrationTable, {
        id: 'r1', courseId: 'c1', email: 'a@x.com', createdAt: '2026-01-01T00:00:00.000Z', posthogDistinctId: 'anon-1',
      });

      const ph = installPosthogBackend();
      await runOne('application_submitted', { now: '2026-07-01T00:00:00.000Z' });

      const identifyBatch = batchWith(ph, '$identify')!;
      const submittedBatch = batchWith(ph, 'application_submitted')!;
      expect(identifyBatch.historicalMigration).toBe(false); // identify is always live
      expect(submittedBatch.historicalMigration).toBe(true); // the old submission is backfilled as historical
      expect(ph.isSamePerson('anon-1', 'a@x.com')).toBe(true);
    });

    test('logs the identify and the submitted event once each: a second run is a no-op', async () => {
      await testDb.insert(courseRegistrationTable, {
        id: 'r1', courseId: 'c1', email: 'a@x.com', createdAt: '2026-05-01T09:00:00.000Z', posthogDistinctId: 'anon-1',
      });

      installPosthogBackend();
      const first = await runOne('application_submitted');
      expect(first).toMatchObject({ sent: 2, alreadySent: 0 });

      const ph2 = installPosthogBackend();
      const second = await runOne('application_submitted');
      expect(second).toMatchObject({ sent: 0, alreadySent: 2 });
      expect(ph2.events).toHaveLength(0);
    });
  });
});
