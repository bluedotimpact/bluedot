import {
  courseRegistrationTable, selfServeCourseRegistrationTable, courseTable, eq, userTable,
  groupDiscussionTable, meetPersonTable, roundTable, unitTable,
  exerciseTable, exerciseResponsePgTable, projectSubmissionTable,
  unitResourceTable, resourceCompletionPgTable, dropoutTable,
} from '@bluedot/db';
import {
  afterEach, describe, expect, test, vi,
} from 'vitest';
import { forwardEventTypeToPostHog, type PostHogEvent } from './core';
import { eventProjectionRules } from './definitions';
import { mockPostHogBackend } from './__tests__/posthogBackend';
import { db, testDb, setupTestDb } from './__tests__/dbTestUtils';

const POSTHOG_CREDS = { host: 'https://test.posthog', apiKey: 'phc_test' };

setupTestDb();
afterEach(() => vi.unstubAllGlobals());

/** used to model prior anonymous browsing */
const sendRawPostHogEvent = (batch: PostHogEvent[]) => fetch('https://test.posthog/batch/', {
  method: 'POST',
  body: JSON.stringify({ historical_migration: false, batch }),
});

const forwardAllEventsToPostHog = async (opts: { since?: string; now?: string } = {}) => {
  const now = opts.now ?? '2026-07-01T00:00:00.000Z';
  for (const projection of eventProjectionRules) {
    // eslint-disable-next-line no-await-in-loop
    await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, since: opts.since, now,
    });
  }
};

const applicationSubmitted = eventProjectionRules.find((p) => p.eventType === 'application_submitted')!;

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

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const certs = ph.events.filter((e) => e.event === 'certificate_issued');
    expect(certs.map((e) => String(e.properties.certificate_id)).sort()).toEqual(['cert1', 'sc1']);
    const courseReg = certs.find((e) => e.properties.certificate_id === 'cert1')!;
    expect(courseReg.distinct_id).toBe('a@x.com');
    expect(courseReg.timestamp).toBe(new Date(1_700_000_000 * 1000).toISOString());
    expect(courseReg.properties).toMatchObject({ course_id: 'c1', round_id: 'rd1' });
    // self-serve has no round
    expect(certs.find((e) => e.properties.certificate_id === 'sc1')!.properties).not.toHaveProperty('round_id');
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
    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ since: '2022-01-01T00:00:00.000Z' });
    expect(ph.events.filter((e) => e.event === 'certificate_issued').map((e) => e.distinct_id)).toEqual(['new@x.com']);
  });

  test('application_accepted: only rows with acceptedAt >= since (ISO text)', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'old', courseId: 'c1', email: 'old@x.com', acceptedAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'new', courseId: 'c1', email: 'new@x.com', acceptedAt: '2026-06-01T00:00:00.000Z',
    });
    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ since: '2026-03-01T00:00:00.000Z' });
    expect(ph.events.filter((e) => e.event === 'application_accepted').map((e) => e.distinct_id)).toEqual(['new@x.com']);
  });

  test('application_rejected: only rows with rejectedAt >= since (ISO text)', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'old', courseId: 'c1', email: 'old@x.com', rejectedAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'new', courseId: 'c1', email: 'new@x.com', rejectedAt: '2026-06-01T00:00:00.000Z',
    });
    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ since: '2026-03-01T00:00:00.000Z' });
    expect(ph.events.filter((e) => e.event === 'application_rejected').map((e) => e.distinct_id)).toEqual(['new@x.com']);
  });

  test('application_submitted: only rows with createdAt >= since (ISO text)', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'old', courseId: 'c1', email: 'old@x.com', createdAt: '2026-01-01T00:00:00.000Z',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'new', courseId: 'c1', email: 'new@x.com', createdAt: '2026-06-01T00:00:00.000Z',
    });
    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ since: '2026-03-01T00:00:00.000Z' });
    expect(ph.events.filter((e) => e.event === 'application_submitted').map((e) => e.distinct_id)).toEqual(['new@x.com']);
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

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const accepts = ph.events.filter((e) => e.event === 'application_accepted');
    expect(accepts).toHaveLength(1);
    expect(accepts[0]?.distinct_id).toBe('acc@x.com');
    expect(accepts[0]?.timestamp).toBe('2026-06-01T10:00:00.000Z');
  });

  test('the log keeps it send-once across runs, even if the source value changes', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'a1', courseId: 'c1', email: 'acc@x.com', acceptedAt: '2026-06-01T10:00:00.000Z',
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph.events.filter((e) => e.event === 'application_accepted')).toHaveLength(1);

    // `Accepted at` is write-once in Airtable, but even if it somehow moved, the log prevents re-emit.
    await db.pg.update(courseRegistrationTable.pg)
      .set({ acceptedAt: '2026-06-20T12:00:00.000Z' })
      .where(eq(courseRegistrationTable.pg.id, 'a1'));

    await forwardAllEventsToPostHog();
    expect(ph.events.filter((e) => e.event === 'application_accepted')).toHaveLength(1);
    expect(ph.events.find((e) => e.event === 'application_accepted')?.timestamp).toBe('2026-06-01T10:00:00.000Z');
  });
});

describe('application_rejected (write-once `Rejected at`)', () => {
  test('emits only for rows with a `Rejected at` timestamp', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'a1', courseId: 'c1', email: 'rej@x.com', rejectedAt: '2026-06-01T10:00:00.000Z',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'a2', courseId: 'c1', email: 'acc@x.com', decision: 'Accept',
    }); // never rejected -> not loaded
    await testDb.insert(courseRegistrationTable, {
      id: 'a3', courseId: 'c1', email: 'pending@x.com', decision: 'Reject',
    }); // Reject but not yet stamped -> not loaded

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const rejects = ph.events.filter((e) => e.event === 'application_rejected');
    expect(rejects).toHaveLength(1);
    expect(rejects[0]?.distinct_id).toBe('rej@x.com');
    expect(rejects[0]?.timestamp).toBe('2026-06-01T10:00:00.000Z');
    expect(rejects[0]?.properties).toMatchObject({ course_id: 'c1' });
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

    const ph = mockPostHogBackend();
    const result = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: applicationSubmitted, now: '2026-07-01T00:00:00.000Z',
    });

    const submits = ph.events.filter((e) => e.event === 'application_submitted');
    expect(result).toMatchObject({ candidates: 2, sent: 2, skipped: 0 });
    expect(submits.map((e) => e.distinct_id).sort()).toEqual(['a@x.com', 'b@x.com']);
    const withSession = submits.find((e) => e.distinct_id === 'a@x.com')!;
    expect(withSession.timestamp).toBe('2026-05-01T09:00:00.000Z');
    expect(withSession.properties).toMatchObject({ course_id: 'c1', round_id: 'rd1', $session_id: 'sess-1' });
    // no session id captured -> no $session_id property
    expect(submits.find((e) => e.distinct_id === 'b@x.com')!.properties).not.toHaveProperty('$session_id');
  });

  test('skips registrations without a createdAt', async () => {
    await testDb.insert(courseRegistrationTable, { id: 'r1', courseId: 'c1', email: 'a@x.com' });

    const ph = mockPostHogBackend();
    const result = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: applicationSubmitted, now: '2026-07-01T00:00:00.000Z',
    });
    expect(result).toMatchObject({ candidates: 0, sent: 0 });
    expect(ph.events.filter((e) => e.event === 'application_submitted')).toHaveLength(0);
  });

  test('reports the readable course title (from courseTable) and round name', async () => {
    await testDb.insert(courseTable, {
      id: 'c1', slug: 'agi-strategy', shortDescription: 'x', title: 'AGI Strategy', units: [],
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'r1', courseId: 'c1', email: 'a@x.com', createdAt: '2026-05-01T09:00:00.000Z', roundId: 'rd1', roundName: 'AGI Strategy (2026 Mar W12) - Part-time',
    });

    const ph = mockPostHogBackend();
    await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: applicationSubmitted, now: '2026-07-01T00:00:00.000Z',
    });

    expect(ph.events.find((e) => e.event === 'application_submitted')?.properties).toMatchObject({
      course_id: 'c1',
      course_name: 'AGI Strategy',
      round_id: 'rd1',
      round_name: 'AGI Strategy (2026 Mar W12) - Part-time',
    });
  });

  // When the form captured the applicant's anonymous PostHog id, application_submitted also emits an
  // `$identify` that merges that anonymous person into the email person. Exercised end-to-end against
  // the in-memory model of PostHog (the same model the staging check validates).
  describe('identify (merge anonymous browsing into the email person)', () => {
    test('merges the captured anonymous id into the email person; the submitted event lands on the merged person', async () => {
      await testDb.insert(courseRegistrationTable, {
        id: 'r1', courseId: 'c1', email: 'a@x.com', createdAt: '2026-05-01T09:00:00.000Z', posthogDistinctId: 'anon-1',
      });

      const ph = mockPostHogBackend();
      // the applicant browsed anonymously (logged out) before applying
      await sendRawPostHogEvent([{
        event: '$pageview', distinct_id: 'anon-1', uuid: 'u0', timestamp: '2026-04-01T00:00:00.000Z', properties: {},
      }]);
      expect(ph.isSamePerson('anon-1', 'a@x.com')).toBe(false);

      const result = await forwardEventTypeToPostHog({
        db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: applicationSubmitted, now: '2026-07-01T00:00:00.000Z',
      });

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

      const ph = mockPostHogBackend();
      const result = await forwardEventTypeToPostHog({
        db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: applicationSubmitted, now: '2026-07-01T00:00:00.000Z',
      });

      expect(result).toMatchObject({ candidates: 2, sent: 2 }); // two submitted events, no identifies
      expect(ph.events.filter((e) => e.event === '$identify')).toHaveLength(0);
      expect(ph.events.filter((e) => e.event === 'application_submitted')).toHaveLength(2);
    });

    test('sends the identify live even for an old (backfilled) application, while the submitted event ships as historical', async () => {
      await testDb.insert(courseRegistrationTable, {
        id: 'r1', courseId: 'c1', email: 'a@x.com', createdAt: '2026-01-01T00:00:00.000Z', posthogDistinctId: 'anon-1',
      });

      const ph = mockPostHogBackend();
      await forwardEventTypeToPostHog({
        db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: applicationSubmitted, now: '2026-07-01T00:00:00.000Z',
      });

      // the identify ships live (in its own batch); the old submission is backfilled as historical
      const liveBatch = ph.receivedBatches.find((b) => !b.historicalMigration)!;
      const historicalBatch = ph.receivedBatches.find((b) => b.historicalMigration)!;
      expect(liveBatch.events.map((e) => e.event)).toEqual(['$identify']);
      expect(historicalBatch.events.map((e) => e.event)).toEqual(['application_submitted']);
      expect(ph.isSamePerson('anon-1', 'a@x.com')).toBe(true);
    });

    test('logs the identify and the submitted event once each: a second run is a no-op', async () => {
      await testDb.insert(courseRegistrationTable, {
        id: 'r1', courseId: 'c1', email: 'a@x.com', createdAt: '2026-05-01T09:00:00.000Z', posthogDistinctId: 'anon-1',
      });

      mockPostHogBackend();
      const first = await forwardEventTypeToPostHog({
        db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: applicationSubmitted, now: '2026-07-01T00:00:00.000Z',
      });
      expect(first).toMatchObject({ sent: 2, alreadySent: 0 });

      const ph2 = mockPostHogBackend();
      const second = await forwardEventTypeToPostHog({
        db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: applicationSubmitted, now: '2026-07-01T00:00:00.000Z',
      });
      expect(second).toMatchObject({ sent: 0, alreadySent: 2 });
      expect(ph2.events).toHaveLength(0);
    });
  });
});

describe('discussion_attended / discussion_absent', () => {
  const NOW = '2026-07-01T00:00:00.000Z';
  const nowSec = Math.floor(Date.parse(NOW) / 1000);

  const insertDiscussion = (d: {
    id: string;
    participantsExpected: string[];
    attendees?: string[];
    startSec: number;
    endSec: number;
    group?: string;
    courseBuilderUnitRecordId?: string;
    unitNumber?: number;
    unitFallback?: string;
  }) => testDb.insert(groupDiscussionTable, {
    id: d.id,
    facilitators: [],
    participantsExpected: d.participantsExpected,
    attendees: d.attendees,
    startDateTime: d.startSec,
    endDateTime: d.endSec,
    group: d.group ?? 'g1',
    courseBuilderUnitRecordId: d.courseBuilderUnitRecordId,
    unitNumber: d.unitNumber,
    unitFallback: d.unitFallback,
  });

  const seedPeople = async () => {
    await testDb.insert(roundTable, { id: 'rd1', title: 'AGI Strategy (2026 Jun W26) - Part-time' });
    await testDb.insert(unitTable, {
      id: 'u1', courseId: 'c1', courseTitle: 'AGI Strategy', courseSlug: 'agi-strategy', title: 'Intro to AGI', unitNumber: '1', unitStatus: 'Active',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp1', email: 'attendee@x.com', round: 'rd1', numUnits: 8,
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp2', email: 'absentee@x.com', round: 'rd1', numUnits: 8,
    });
  };

  test('attended for those in attendees, absent for the rest once the discussion has ended', async () => {
    await seedPeople();
    await insertDiscussion({
      id: 'd1',
      participantsExpected: ['mp1', 'mp2'],
      attendees: ['mp1'],
      startSec: nowSec - 7200,
      endSec: nowSec - 3600, // ended an hour ago
      courseBuilderUnitRecordId: 'u1',
      unitNumber: 1,
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ now: NOW });

    const attended = ph.events.filter((e) => e.event === 'discussion_attended');
    const absent = ph.events.filter((e) => e.event === 'discussion_absent');
    expect(attended.map((e) => e.distinct_id)).toEqual(['attendee@x.com']);
    expect(absent.map((e) => e.distinct_id)).toEqual(['absentee@x.com']);

    // both attended and absent are timestamped at the discussion's scheduled start
    expect(attended[0]!.timestamp).toBe(new Date((nowSec - 7200) * 1000).toISOString());
    expect(absent[0]!.timestamp).toBe(new Date((nowSec - 7200) * 1000).toISOString());
    expect(attended[0]!.properties).toMatchObject({
      discussion_id: 'd1',
      course_id: 'c1',
      course_name: 'AGI Strategy',
      course_slug: 'agi-strategy',
      round_id: 'rd1',
      round_name: 'AGI Strategy (2026 Jun W26) - Part-time',
      unit_number: 1,
      unit_name: 'Intro to AGI',
      group_id: 'g1',
      num_discussions: 8,
    });
  });

  test('no absent within the 15-minute grace, nor for live/upcoming discussions', async () => {
    await seedPeople();
    await insertDiscussion({
      id: 'recent', participantsExpected: ['mp2'], attendees: [], startSec: nowSec - 3900, endSec: nowSec - 300, // ended 5 min ago
    });
    await insertDiscussion({
      id: 'upcoming', participantsExpected: ['mp2'], attendees: [], startSec: nowSec + 3600, endSec: nowSec + 7200,
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ now: NOW });

    expect(ph.events.filter((e) => e.event === 'discussion_absent')).toHaveLength(0);
  });

  test('attended emits even while the discussion is live (not gated by the grace)', async () => {
    await seedPeople();
    await insertDiscussion({
      id: 'live', participantsExpected: ['mp1'], attendees: ['mp1'], startSec: nowSec - 600, endSec: nowSec + 3000,
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ now: NOW });

    const attended = ph.events.filter((e) => e.event === 'discussion_attended');
    expect(attended.map((e) => e.distinct_id)).toEqual(['attendee@x.com']);
  });

  test('skips expected participants we cannot resolve an email for', async () => {
    await testDb.insert(meetPersonTable, { id: 'mp1', email: 'attendee@x.com', round: 'rd1' });
    await testDb.insert(meetPersonTable, { id: 'noEmail' }); // no email -> skipped
    await insertDiscussion({
      id: 'd1', participantsExpected: ['mp1', 'noEmail'], attendees: ['mp1'], startSec: nowSec - 7200, endSec: nowSec - 3600,
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ now: NOW });

    expect(ph.events.filter((e) => e.event === 'discussion_attended').map((e) => e.distinct_id)).toEqual(['attendee@x.com']);
    expect(ph.events.filter((e) => e.event === 'discussion_absent')).toHaveLength(0);
  });

  test('since scans only discussions ending on/after it', async () => {
    await seedPeople();
    await insertDiscussion({
      id: 'old', participantsExpected: ['mp2'], attendees: [], startSec: nowSec - (100 * 86400), endSec: nowSec - (100 * 86400) + 3600,
    });
    await insertDiscussion({
      id: 'recentEnded', participantsExpected: ['mp2'], attendees: [], startSec: nowSec - 7200, endSec: nowSec - 3600,
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ now: NOW, since: new Date((nowSec - 86400) * 1000).toISOString() });

    const absent = ph.events.filter((e) => e.event === 'discussion_absent');
    expect(absent.map((e) => e.properties.discussion_id)).toEqual(['recentEnded']);
  });

  test('send-once across runs: a second run re-sends nothing', async () => {
    await seedPeople();
    await insertDiscussion({
      id: 'd1', participantsExpected: ['mp1', 'mp2'], attendees: ['mp1'], startSec: nowSec - 7200, endSec: nowSec - 3600,
    });

    mockPostHogBackend();
    await forwardAllEventsToPostHog({ now: NOW });

    const ph2 = mockPostHogBackend();
    await forwardAllEventsToPostHog({ now: NOW });
    expect(ph2.events.filter((e) => e.event.startsWith('discussion_'))).toHaveLength(0);
  });
});

describe('exercise_completed', () => {
  const seedCourse = (id: string, title: string) => testDb.insert(courseTable, {
    id, slug: id, title, shortDescription: title, units: [], status: 'Active',
  });
  const seedExercise = (id: string, opts: { courseId?: string; unitId?: string; title?: string; type?: string } = {}) =>
    testDb.insert(exerciseTable, {
      id, courseId: opts.courseId, unitId: opts.unitId, title: opts.title, type: opts.type, status: 'Core',
    });
  const completeExercise = (id: string, email: string, exerciseId: string, completedAt: string | null) =>
    db.pg.insert(exerciseResponsePgTable.pg).values({
      id, email, exerciseId, response: 'an answer', createdAt: '2026-06-01T00:00:00.000Z', completedAt,
    });

  test('emits one event per completed response, enriched with the exercise and course', async () => {
    await seedCourse('c1', 'AGI Strategy');
    await seedExercise('ex2', {
      courseId: 'c1', unitId: 'u1', title: 'Quiz', type: 'Multiple choice',
    });
    await completeExercise('r1', 'a@x.com', 'ex2', '2026-06-10T10:00:00.000Z');

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const events = ph.events.filter((e) => e.event === 'exercise_completed');
    expect(events).toHaveLength(1);
    expect(events[0]!.distinct_id).toBe('a@x.com');
    expect(events[0]!.timestamp).toBe('2026-06-10T10:00:00.000Z');
    expect(events[0]!.properties).toMatchObject({
      exercise_id: 'ex2',
      exercise_name: 'Quiz',
      exercise_type: 'Multiple choice',
      unit_id: 'u1',
      course_id: 'c1',
      course_name: 'AGI Strategy',
    });
  });

  test('skips responses without a completedAt', async () => {
    await seedCourse('c1', 'AGI Strategy');
    await seedExercise('ex1', { courseId: 'c1' });
    await completeExercise('r1', 'a@x.com', 'ex1', null);

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph.events.filter((e) => e.event === 'exercise_completed')).toHaveLength(0);
  });

  test('since scans only responses completed on/after it', async () => {
    await seedCourse('c1', 'AGI Strategy');
    await seedExercise('ex1', { courseId: 'c1' });
    await completeExercise('old', 'old@x.com', 'ex1', '2026-01-01T00:00:00.000Z');
    await completeExercise('new', 'new@x.com', 'ex1', '2026-06-01T00:00:00.000Z');

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ since: '2026-03-01T00:00:00.000Z' });

    expect(ph.events.filter((e) => e.event === 'exercise_completed').map((e) => e.distinct_id)).toEqual(['new@x.com']);
  });

  test('send-once across runs: a second run re-sends nothing', async () => {
    await seedCourse('c1', 'AGI Strategy');
    await seedExercise('ex1', { courseId: 'c1' });
    await completeExercise('r1', 'a@x.com', 'ex1', '2026-06-10T10:00:00.000Z');

    mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const ph2 = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph2.events.filter((e) => e.event === 'exercise_completed')).toHaveLength(0);
  });
});

describe('resource_completed', () => {
  const seedUnit = (id: string, opts: { courseId?: string; unitNumber?: string; title?: string } = {}) =>
    testDb.insert(unitTable, {
      id,
      courseId: opts.courseId ?? 'c1',
      courseTitle: 'AGI Strategy',
      courseSlug: 'agi-strategy',
      title: opts.title ?? 'Intro to AGI',
      unitNumber: opts.unitNumber ?? '1',
      unitStatus: 'Active',
    });
  const seedUnitResource = (id: string, opts: { unitId?: string; resourceName?: string; coreFurtherMaybe?: string } = {}) =>
    testDb.insert(unitResourceTable, {
      id, unitId: opts.unitId, resourceName: opts.resourceName, coreFurtherMaybe: opts.coreFurtherMaybe,
    });
  const completeResource = (
    id: string, email: string | null, unitResourceId: string | null, completedAt: string | null,
    resourceId?: string,
  ) =>
    db.pg.insert(resourceCompletionPgTable.pg).values({
      id,
      email,
      unitResourceId,
      resourceId: resourceId ? [resourceId] : null,
      createdAt: '2026-06-01T00:00:00.000Z',
      completedAt,
    });

  test('emits one event per completed resource, enriched with the unit_resource and unit', async () => {
    await seedUnit('u1', { unitNumber: '2', title: 'What is AGI?' });
    await seedUnitResource('ur1', { unitId: 'u1', resourceName: 'The Bitter Lesson', coreFurtherMaybe: 'Core' });
    await completeResource('rc1', 'a@x.com', 'ur1', '2026-06-10T10:00:00.000Z', 'res1');

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const events = ph.events.filter((e) => e.event === 'resource_completed');
    expect(events).toHaveLength(1);
    expect(events[0]!.distinct_id).toBe('a@x.com');
    expect(events[0]!.timestamp).toBe('2026-06-10T10:00:00.000Z');
    expect(events[0]!.properties).toMatchObject({
      resource_id: 'res1',
      unit_resource_id: 'ur1',
      resource_name: 'The Bitter Lesson',
      core_further_maybe: 'Core',
      unit_id: 'u1',
      unit_number: 2,
      unit_name: 'What is AGI?',
      course_id: 'c1',
      course_name: 'AGI Strategy',
      course_slug: 'agi-strategy',
    });
  });

  test('skips completions without a completedAt', async () => {
    await seedUnitResource('ur1', { unitId: 'u1' });
    await completeResource('rc1', 'a@x.com', 'ur1', null);

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph.events.filter((e) => e.event === 'resource_completed')).toHaveLength(0);
  });

  test('skips completions without an email (no distinct id to attribute)', async () => {
    await seedUnitResource('ur1', { unitId: 'u1' });
    await completeResource('rc1', null, 'ur1', '2026-06-10T10:00:00.000Z');

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph.events.filter((e) => e.event === 'resource_completed')).toHaveLength(0);
  });

  test('since scans only completions on/after it', async () => {
    await seedUnitResource('ur1', { unitId: 'u1' });
    await completeResource('old', 'old@x.com', 'ur1', '2026-01-01T00:00:00.000Z');
    await completeResource('new', 'new@x.com', 'ur1', '2026-06-01T00:00:00.000Z');

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ since: '2026-03-01T00:00:00.000Z' });

    expect(ph.events.filter((e) => e.event === 'resource_completed').map((e) => e.distinct_id)).toEqual(['new@x.com']);
  });

  test('send-once across runs: a second run re-sends nothing', async () => {
    await seedUnitResource('ur1', { unitId: 'u1' });
    await completeResource('rc1', 'a@x.com', 'ur1', '2026-06-10T10:00:00.000Z');

    mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const ph2 = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph2.events.filter((e) => e.event === 'resource_completed')).toHaveLength(0);
  });
});

describe('project_submitted', () => {
  // distinct id (email) and course/round are all resolved via the participant link, not stored on the row:
  // submission.participant -> meetPerson.email, and meetPerson.applicationsBaseRecordId -> course_registration.
  const seedRegisteredParticipant = async () => {
    await testDb.insert(courseTable, {
      id: 'c1', slug: 'agi-strategy', shortDescription: 'x', title: 'AGI Strategy', units: [], status: 'Active',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'cr1', courseId: 'c1', email: 'a@x.com', roundId: 'rd1', roundName: 'AGI Strategy (2026 Mar W14) - Intensive',
    });
    await testDb.insert(meetPersonTable, { id: 'mp1', email: 'a@x.com', applicationsBaseRecordId: 'cr1' });
  };

  test('emits one event per submission at its createdAt, enriched with course/round via the participant link', async () => {
    await seedRegisteredParticipant();
    await testDb.insert(projectSubmissionTable, {
      id: 'ps1',
      createdAt: '2026-06-08T01:10:28.000Z',
      projectTitle: 'My action plan',
      link: 'https://docs.google.com/document/d/abc',
      participant: ['mp1'],
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const events = ph.events.filter((e) => e.event === 'project_submitted');
    expect(events).toHaveLength(1);
    expect(events[0]!.distinct_id).toBe('a@x.com');
    expect(events[0]!.timestamp).toBe('2026-06-08T01:10:28.000Z');
    expect(events[0]!.properties).toMatchObject({
      course_id: 'c1',
      course_name: 'AGI Strategy',
      round_id: 'rd1',
      round_name: 'AGI Strategy (2026 Mar W14) - Intensive',
      project_title: 'My action plan',
      project_url: 'https://docs.google.com/document/d/abc',
    });
  });

  test('emits with email but no course/round when the participant has no registration', async () => {
    await testDb.insert(meetPersonTable, { id: 'mp2', email: 'solo@x.com' }); // no applicationsBaseRecordId
    await testDb.insert(projectSubmissionTable, {
      id: 'ps1', createdAt: '2026-06-08T01:10:28.000Z', link: 'https://example.com/p', participant: ['mp2'],
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const event = ph.events.find((e) => e.event === 'project_submitted')!;
    expect(event.distinct_id).toBe('solo@x.com');
    expect(event.properties).toMatchObject({ project_url: 'https://example.com/p' });
    expect(event.properties).not.toHaveProperty('course_id');
    expect(event.properties).not.toHaveProperty('round_id');
  });

  test('group projects fan out: one event per participant, each keyed and attributed separately', async () => {
    await seedRegisteredParticipant(); // mp1 -> a@x.com (course c1, round rd1)
    await testDb.insert(meetPersonTable, { id: 'mp2', email: 'b@x.com', applicationsBaseRecordId: 'cr1' });
    await testDb.insert(projectSubmissionTable, {
      id: 'ps1', createdAt: '2026-06-08T01:10:28.000Z', projectTitle: 'Group plan', participant: ['mp1', 'mp2'],
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const events = ph.events.filter((e) => e.event === 'project_submitted');
    expect(events.map((e) => e.distinct_id).sort()).toEqual(['a@x.com', 'b@x.com']);
    // distinct uuids (derived from the per-participant internalUniqueKey) so neither is dropped as a duplicate
    expect(new Set(events.map((e) => e.uuid)).size).toBe(2);
    expect(events.every((e) => e.properties.project_title === 'Group plan' && e.properties.course_id === 'c1')).toBe(true);
  });

  test('skips submissions whose participant resolves to no email (nothing to attribute to)', async () => {
    await testDb.insert(projectSubmissionTable, {
      id: 'ps1', createdAt: '2026-06-08T01:10:28.000Z', link: 'https://example.com/p', participant: ['unknown'],
    });

    const ph = mockPostHogBackend();
    const result = await forwardEventTypeToPostHog({
      db,
      posthogCredentials: POSTHOG_CREDS,
      eventProjectionRule: eventProjectionRules.find((p) => p.eventType === 'project_submitted')!,
      now: '2026-07-01T00:00:00.000Z',
    });
    expect(result).toMatchObject({ candidates: 1, skipped: 1, sent: 0 });
    expect(ph.events.filter((e) => e.event === 'project_submitted')).toHaveLength(0);
  });

  test('since scans only submissions created on/after it', async () => {
    await seedRegisteredParticipant();
    await testDb.insert(projectSubmissionTable, {
      id: 'old', createdAt: '2026-01-01T00:00:00.000Z', participant: ['mp1'],
    });
    await testDb.insert(meetPersonTable, { id: 'mp2', email: 'new@x.com' });
    await testDb.insert(projectSubmissionTable, {
      id: 'new', createdAt: '2026-06-01T00:00:00.000Z', participant: ['mp2'],
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ since: '2026-03-01T00:00:00.000Z' });

    expect(ph.events.filter((e) => e.event === 'project_submitted').map((e) => e.distinct_id)).toEqual(['new@x.com']);
  });

  test('send-once across runs: a second run re-sends nothing', async () => {
    await seedRegisteredParticipant();
    await testDb.insert(projectSubmissionTable, {
      id: 'ps1', createdAt: '2026-06-08T01:10:28.000Z', participant: ['mp1'],
    });

    mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const ph2 = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph2.events.filter((e) => e.event === 'project_submitted')).toHaveLength(0);
  });
});

describe('application_withdrawn', () => {
  const seedWithdrawn = (id: string, email: string, withdrawnAt: string | null) => testDb.insert(courseRegistrationTable, {
    id, courseId: 'c1', email, roundId: 'rd1', roundName: 'AGI Strategy (2026 Mar W14) - Intensive', withdrawnAt,
  });

  test('emits at withdrawnAt, enriched with course and round', async () => {
    await testDb.insert(courseTable, {
      id: 'c1', slug: 'agi-strategy', shortDescription: 'x', title: 'AGI Strategy', units: [], status: 'Active',
    });
    await seedWithdrawn('cr1', 'a@x.com', '2026-06-10T10:00:00.000Z');

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const events = ph.events.filter((e) => e.event === 'application_withdrawn');
    expect(events).toHaveLength(1);
    expect(events[0]!.distinct_id).toBe('a@x.com');
    expect(events[0]!.timestamp).toBe('2026-06-10T10:00:00.000Z');
    expect(events[0]!.properties).toMatchObject({
      course_id: 'c1',
      course_name: 'AGI Strategy',
      round_id: 'rd1',
      round_name: 'AGI Strategy (2026 Mar W14) - Intensive',
    });
  });

  test('emits only for rows with a withdrawnAt timestamp', async () => {
    await seedWithdrawn('cr1', 'pending@x.com', null);

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph.events.filter((e) => e.event === 'application_withdrawn')).toHaveLength(0);
  });

  test('since scans only rows withdrawn on/after it', async () => {
    await seedWithdrawn('old', 'old@x.com', '2026-01-01T00:00:00.000Z');
    await seedWithdrawn('new', 'new@x.com', '2026-06-01T00:00:00.000Z');

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ since: '2026-03-01T00:00:00.000Z' });
    expect(ph.events.filter((e) => e.event === 'application_withdrawn').map((e) => e.distinct_id)).toEqual(['new@x.com']);
  });

  test('send-once across runs: a second run re-sends nothing', async () => {
    await seedWithdrawn('cr1', 'a@x.com', '2026-06-10T10:00:00.000Z');

    mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const ph2 = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph2.events.filter((e) => e.event === 'application_withdrawn')).toHaveLength(0);
  });
});

describe('course_dropped_out / course_deferred', () => {
  const seedCourseAndRegistration = async () => {
    await testDb.insert(courseTable, {
      id: 'c1', slug: 'agi-strategy', shortDescription: 'x', title: 'AGI Strategy', units: [], status: 'Active',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'cr1', courseId: 'c1', email: 'a@x.com', roundId: 'rd1', roundName: 'AGI Strategy (2026 Mar W14) - Intensive',
    });
  };

  const seedDropout = (id: string, type: string, opts: { applicantId?: string; createdAt?: string } = {}) => testDb.insert(dropoutTable, {
    id,
    type,
    applicantId: opts.applicantId ? [opts.applicantId] : null,
    createdAt: opts.createdAt ?? '2026-06-10T10:00:00.000Z',
  });

  test('course_dropped_out: emits at the dropout createdAt, enriched via the linked application', async () => {
    await seedCourseAndRegistration();
    await seedDropout('do1', 'Drop out', { applicantId: 'cr1', createdAt: '2026-06-10T10:00:00.000Z' });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const events = ph.events.filter((e) => e.event === 'course_dropped_out');
    expect(events).toHaveLength(1);
    expect(events[0]!.distinct_id).toBe('a@x.com');
    expect(events[0]!.timestamp).toBe('2026-06-10T10:00:00.000Z');
    expect(events[0]!.properties).toMatchObject({
      course_id: 'c1',
      course_name: 'AGI Strategy',
      round_id: 'rd1',
      round_name: 'AGI Strategy (2026 Mar W14) - Intensive',
    });
  });

  test('drop-out and deferral are separated by type, each at its own row', async () => {
    await seedCourseAndRegistration();
    await seedDropout('do1', 'Drop out', { applicantId: 'cr1', createdAt: '2026-06-10T10:00:00.000Z' });
    await seedDropout('df1', 'Deferral', { applicantId: 'cr1', createdAt: '2026-06-12T10:00:00.000Z' });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const dropped = ph.events.filter((e) => e.event === 'course_dropped_out');
    const deferred = ph.events.filter((e) => e.event === 'course_deferred');
    expect(dropped.map((e) => e.timestamp)).toEqual(['2026-06-10T10:00:00.000Z']);
    expect(deferred.map((e) => e.timestamp)).toEqual(['2026-06-12T10:00:00.000Z']);
    expect(deferred[0]!.distinct_id).toBe('a@x.com');
  });

  test('skips a dropout whose application cannot be resolved (no email to attribute)', async () => {
    await seedDropout('do1', 'Drop out', { applicantId: 'missing' });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph.events.filter((e) => e.event === 'course_dropped_out')).toHaveLength(0);
  });

  test('since scans only dropouts created on/after it', async () => {
    await seedCourseAndRegistration();
    await seedDropout('old', 'Drop out', { applicantId: 'cr1', createdAt: '2026-01-01T00:00:00.000Z' });
    await seedDropout('new', 'Drop out', { applicantId: 'cr1', createdAt: '2026-06-01T00:00:00.000Z' });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ since: '2026-03-01T00:00:00.000Z' });
    expect(ph.events.filter((e) => e.event === 'course_dropped_out').map((e) => e.timestamp)).toEqual(['2026-06-01T00:00:00.000Z']);
  });

  test('send-once across runs: a second run re-sends nothing', async () => {
    await seedCourseAndRegistration();
    await seedDropout('do1', 'Drop out', { applicantId: 'cr1' });

    mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const ph2 = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph2.events.filter((e) => e.event === 'course_dropped_out')).toHaveLength(0);
  });
});

describe('identify_applicants', () => {
  const identifyApplicants = eventProjectionRules.find((p) => p.eventType === 'identify_applicants')!;

  const runIdentifyApplicants = (opts: { since?: string } = {}) => forwardEventTypeToPostHog({
    db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: identifyApplicants, since: opts.since, now: '2026-07-01T00:00:00.000Z',
  });

  const seedRegistration = (id: string, email: string, opts: { createdAt?: string; posthogDistinctId?: string } = {}) => (
    testDb.insert(courseRegistrationTable, {
      id, courseId: 'c1', email, createdAt: opts.createdAt ?? '2026-05-01T00:00:00.000Z', posthogDistinctId: opts.posthogDistinctId,
    })
  );

  const seedLoggedInUser = (id: string, email: string, opts: { firstLoggedInAt?: string | null } = {}) => testDb.insert(userTable, {
    id, email, name: email, firstLoggedInAt: opts.firstLoggedInAt === undefined ? '2026-05-02T00:00:00.000Z' : opts.firstLoggedInAt,
  });

  test('a new login joins an application created before `since`', async () => {
    await seedRegistration('cr1', 'a@x.com', { createdAt: '2026-01-01T00:00:00.000Z', posthogDistinctId: 'anon-1' });
    await seedLoggedInUser('u1', 'a@x.com', { firstLoggedInAt: '2026-06-01T00:00:00.000Z' });

    const ph = mockPostHogBackend();
    await runIdentifyApplicants({ since: '2026-03-01T00:00:00.000Z' });

    const identify = ph.events.find((e) => e.event === '$identify')!;
    expect(identify.distinct_id).toBe('a@x.com');
    expect(identify.properties).toMatchObject({ $anon_distinct_id: 'anon-1', $set: { email: 'a@x.com' } });
  });

  test('a new application joins a user who logged in before `since`', async () => {
    await seedLoggedInUser('u1', 'a@x.com', { firstLoggedInAt: '2026-01-01T00:00:00.000Z' });
    await seedRegistration('cr1', 'a@x.com', { createdAt: '2026-06-01T00:00:00.000Z', posthogDistinctId: 'anon-1' });

    const ph = mockPostHogBackend();
    await runIdentifyApplicants({ since: '2026-03-01T00:00:00.000Z' });

    const identify = ph.events.find((e) => e.event === '$identify')!;
    expect(identify.distinct_id).toBe('a@x.com');
    expect(identify.properties).toMatchObject({ $anon_distinct_id: 'anon-1' });
  });

  test('anchors on the registration record id when no posthogDistinctId was captured', async () => {
    await seedRegistration('cr-norec', 'b@x.com');
    await seedLoggedInUser('u1', 'b@x.com');

    const ph = mockPostHogBackend();
    await runIdentifyApplicants();

    expect(ph.events.find((e) => e.event === '$identify')!.properties).toMatchObject({ $anon_distinct_id: 'cr-norec' });
  });

  test('anchors on the record id when posthogDistinctId is the email itself (legacy rows)', async () => {
    await seedRegistration('cr-legacy', 'b@x.com', { posthogDistinctId: 'b@x.com' });
    await seedLoggedInUser('u1', 'b@x.com');

    const ph = mockPostHogBackend();
    await runIdentifyApplicants();

    expect(ph.events.find((e) => e.event === '$identify')!.properties).toMatchObject({ $anon_distinct_id: 'cr-legacy' });
  });

  test('no-op when no user has the application email', async () => {
    await seedRegistration('cr1', 'orphan@x.com', { posthogDistinctId: 'anon-1' });

    const ph = mockPostHogBackend();
    await runIdentifyApplicants();

    expect(ph.events).toHaveLength(0);
  });

  test('no-op when the matching user has never logged in', async () => {
    // user rows are created at apply time, before any login — that alone must not trigger a join
    await seedRegistration('cr1', 'a@x.com', { posthogDistinctId: 'anon-1' });
    await seedLoggedInUser('u1', 'a@x.com', { firstLoggedInAt: null });

    const ph = mockPostHogBackend();
    await runIdentifyApplicants();

    expect(ph.events).toHaveLength(0);
  });

  test('each application is joined at most once across runs', async () => {
    await seedRegistration('cr1', 'a@x.com', { posthogDistinctId: 'anon-1' });
    await seedLoggedInUser('u1', 'a@x.com');

    mockPostHogBackend();
    expect(await runIdentifyApplicants()).toMatchObject({ sent: 1 });

    const ph2 = mockPostHogBackend();
    expect(await runIdentifyApplicants()).toMatchObject({ sent: 0, alreadySent: 1 });
    expect(ph2.events).toHaveLength(0);
  });

  test('earliest login wins when multiple users share an email', async () => {
    await seedRegistration('cr1', 'shared@x.com', { posthogDistinctId: 'anon-1' });
    await seedLoggedInUser('u-late', 'shared@x.com', { firstLoggedInAt: '2026-06-01T00:00:00.000Z' });
    await seedLoggedInUser('u-early', 'shared@x.com', { firstLoggedInAt: '2026-04-01T00:00:00.000Z' });

    const ph = mockPostHogBackend();
    await runIdentifyApplicants();

    const identifies = ph.events.filter((e) => e.event === '$identify');
    expect(identifies).toHaveLength(1);
    expect(identifies[0]!.timestamp).toBe('2026-04-01T00:00:00.000Z'); // the earliest login's timestamp
  });
});
