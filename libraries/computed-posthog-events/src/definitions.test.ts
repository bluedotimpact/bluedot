import {
  courseRegistrationTable, selfServeCourseRegistrationTable, courseTable, eq, userTable,
  groupDiscussionTable, meetPersonTable, roundTable, unitTable,
  exerciseTable, exerciseResponsePgTable, projectSubmissionTable,
  unitResourceTable, resourceCompletionPgTable, dropoutTable,
} from '@bluedot/db';
import {
  afterEach, describe, expect, test, vi,
} from 'vitest';
import { forwardEventTypeToPostHog } from './core';
import { eventProjectionRules } from './definitions';
import { mockPostHogBackend } from './__tests__/posthogBackend';
import { db, testDb, setupTestDb } from './__tests__/dbTestUtils';

const POSTHOG_CREDS = { host: 'https://test.posthog', apiKey: 'phc_test' };

setupTestDb();
afterEach(() => vi.unstubAllGlobals());

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
    await testDb.insert(userTable, {
      id: 'u-fac', email: 'a@x.com', name: 'a', keycloakIdentifier: 'sub-u-fac',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'cr1', courseId: 'c1', email: 'a@x.com', userId: 'u-fac', certificateId: 'cert1', certificateCreatedAt: 1_700_000_000, roundId: 'rd1',
    });
    await testDb.insert(courseRegistrationTable, { id: 'cr2', courseId: 'c1', email: 'b@x.com' }); // no cert -> not loaded
    await testDb.insert(courseRegistrationTable, {
      id: 'cr3', courseId: 'c1', email: 'd@x.com', certificateCreatedAt: 1_700_000_500,
    }); // cert timestamp but no certificateId -> loaded, but emits nothing
    await testDb.insert(userTable, {
      id: 'u-ss', email: 'c@x.com', name: 'c', keycloakIdentifier: 'sub-u-ss',
    });
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss1', courseId: 'c2', userId: 'u-ss', certificateId: 'sc1', certificateCreatedAt: 1_700_000_001,
    });
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss2', courseId: 'c2', certificateId: 'sc2', certificateCreatedAt: 1_700_000_002,
    }); // no linked user -> nothing to attribute to

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const certs = ph.events.filter((e) => e.event === 'certificate_issued');
    expect(certs.map((e) => String(e.properties.certificate_id)).sort()).toEqual(['cert1', 'sc1']);
    const courseReg = certs.find((e) => e.properties.certificate_id === 'cert1')!;
    expect(courseReg.distinct_id).toBe('sub-u-fac');
    expect(courseReg.timestamp).toBe(new Date(1_700_000_000 * 1000).toISOString());
    expect(courseReg.properties).toMatchObject({ course_id: 'c1', round_id: 'rd1' });
    // self-serve identity comes from the linked user (keycloak sub), and self-serve has no round
    const selfServeCert = certs.find((e) => e.properties.certificate_id === 'sc1')!;
    expect(selfServeCert.distinct_id).toBe('sub-u-ss');
    expect(selfServeCert.properties).not.toHaveProperty('round_id');
  });
});

describe('since (incremental scans)', () => {
  test('certificate_issued: only rows with certificateCreatedAt >= since (epoch seconds)', async () => {
    await testDb.insert(userTable, {
      id: 'u-old', email: 'old@x.com', name: 'old', keycloakIdentifier: 'sub-u-old',
    });
    await testDb.insert(userTable, {
      id: 'u-new', email: 'new@x.com', name: 'new', keycloakIdentifier: 'sub-u-new',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'old', courseId: 'c1', email: 'old@x.com', userId: 'u-old', certificateId: 'cOld', certificateCreatedAt: 1_600_000_000,
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'new', courseId: 'c1', email: 'new@x.com', userId: 'u-new', certificateId: 'cNew', certificateCreatedAt: 1_700_000_000,
    });
    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ since: '2022-01-01T00:00:00.000Z' });
    expect(ph.events.filter((e) => e.event === 'certificate_issued').map((e) => e.distinct_id)).toEqual(['sub-u-new']);
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
    expect(ph.events.filter((e) => e.event === 'application_accepted').map((e) => e.distinct_id)).toEqual(['new']);
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
    expect(ph.events.filter((e) => e.event === 'application_rejected').map((e) => e.distinct_id)).toEqual(['new']);
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
    // no posthogDistinctId captured, so it falls back to the record id, not the email
    expect(ph.events.filter((e) => e.event === 'application_submitted').map((e) => e.distinct_id)).toEqual(['new']);
  });
});

describe('application_accepted (write-once `Accepted at`)', () => {
  test('emits only for rows with an `Accepted at` timestamp', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'a1', courseId: 'c1', email: 'acc@x.com', posthogDistinctId: 'anon-a1', acceptedAt: '2026-06-01T10:00:00.000Z',
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
    // no linked user -> falls back to the registration's anon anchor (same as its application_submitted)
    expect(accepts[0]?.distinct_id).toBe('anon-a1');
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
    expect(rejects[0]?.distinct_id).toBe('a1');
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
    // emitted under the anonymous anchor (record id, as no posthogDistinctId was captured), not the email
    expect(submits.map((e) => e.distinct_id).sort()).toEqual(['r1', 'r2']);
    const withSession = submits.find((e) => e.distinct_id === 'r1')!;
    expect(withSession.timestamp).toBe('2026-05-01T09:00:00.000Z');
    expect(withSession.properties).toMatchObject({
      course_id: 'c1', round_id: 'rd1', $session_id: 'sess-1', $set: { email: 'a@x.com' },
    });
    // no session id captured -> no $session_id property
    expect(submits.find((e) => e.distinct_id === 'r2')!.properties).not.toHaveProperty('$session_id');
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

  test('emits under the captured posthogDistinctId (not the email), with the email as a $set property and no identify', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'r1', courseId: 'c1', email: 'a@x.com', createdAt: '2026-05-01T09:00:00.000Z', posthogDistinctId: 'anon-1',
    });

    const ph = mockPostHogBackend();
    await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: applicationSubmitted, now: '2026-07-01T00:00:00.000Z',
    });

    const submit = ph.events.find((e) => e.event === 'application_submitted')!;
    expect(submit.distinct_id).toBe('anon-1'); // the captured browse device id, not the email
    expect(submit.properties).toMatchObject({ $set: { email: 'a@x.com' } });
    expect(ph.events.filter((e) => e.event === '$identify')).toHaveLength(0);
  });

  test('falls back to the record id when no posthogDistinctId was captured', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'none', courseId: 'c1', email: 'a@x.com', createdAt: '2026-05-01T09:00:00.000Z',
    });

    const ph = mockPostHogBackend();
    await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: applicationSubmitted, now: '2026-07-01T00:00:00.000Z',
    });

    expect(ph.events.filter((e) => e.event === 'application_submitted').map((e) => e.distinct_id)).toEqual(['none']);
    expect(ph.events.filter((e) => e.event === '$identify')).toHaveLength(0);
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
    await testDb.insert(userTable, {
      id: 'u-att', email: 'attendee@x.com', name: 'attendee', keycloakIdentifier: 'sub-u-att',
    });
    await testDb.insert(userTable, {
      id: 'u-abs', email: 'absentee@x.com', name: 'absentee', keycloakIdentifier: 'sub-u-abs',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp1', userId: 'u-att', round: 'rd1', numUnits: 8,
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp2', userId: 'u-abs', round: 'rd1', numUnits: 8,
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
    expect(attended.map((e) => e.distinct_id)).toEqual(['sub-u-att']);
    expect(absent.map((e) => e.distinct_id)).toEqual(['sub-u-abs']);

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
    expect(attended.map((e) => e.distinct_id)).toEqual(['sub-u-att']);
  });

  test('skips expected participants we cannot resolve an identity for', async () => {
    await testDb.insert(userTable, {
      id: 'u-att', email: 'attendee@x.com', name: 'attendee', keycloakIdentifier: 'sub-u-att',
    });
    await testDb.insert(userTable, { id: 'u-nosub', email: 'nosub@x.com', name: 'nosub' }); // no keycloakIdentifier -> skipped
    await testDb.insert(meetPersonTable, { id: 'mp1', userId: 'u-att', round: 'rd1' });
    await testDb.insert(meetPersonTable, { id: 'mpNoSub', userId: 'u-nosub', round: 'rd1' });
    await testDb.insert(meetPersonTable, { id: 'noUser' }); // no linked user -> skipped
    await insertDiscussion({
      id: 'd1', participantsExpected: ['mp1', 'mpNoSub', 'noUser'], attendees: ['mp1', 'mpNoSub'], startSec: nowSec - 7200, endSec: nowSec - 3600,
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ now: NOW });

    expect(ph.events.filter((e) => e.event === 'discussion_attended').map((e) => e.distinct_id)).toEqual(['sub-u-att']);
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
  const seedUser = (id: string, email: string) => testDb.insert(userTable, {
    id, email, name: email, keycloakIdentifier: `sub-${id}`,
  });
  const completeExercise = (id: string, userId: string | null, exerciseId: string, completedAt: string | null) =>
    db.pg.insert(exerciseResponsePgTable.pg).values({
      id, exerciseId, response: 'an answer', createdAt: '2026-06-01T00:00:00.000Z', completedAt, userId: userId ? [userId] : null,
    });

  test('emits one event per completed response with the linked user\'s keycloak sub, enriched with the exercise and course', async () => {
    await seedCourse('c1', 'AGI Strategy');
    await seedExercise('ex2', {
      courseId: 'c1', unitId: 'u1', title: 'Quiz', type: 'Multiple choice',
    });
    await seedUser('u1', 'a@x.com');
    await completeExercise('r1', 'u1', 'ex2', '2026-06-10T10:00:00.000Z');
    await completeExercise('r2', null, 'ex2', '2026-06-10T10:00:00.000Z'); // no linked user -> nothing to attribute to

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const events = ph.events.filter((e) => e.event === 'exercise_completed');
    expect(events).toHaveLength(1);
    // the user's keycloak sub, not any email
    expect(events[0]!.distinct_id).toBe('sub-u1');
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
    await seedUser('u1', 'a@x.com');
    await completeExercise('r1', 'u1', 'ex1', null);

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph.events.filter((e) => e.event === 'exercise_completed')).toHaveLength(0);
  });

  test('since scans only responses completed on/after it', async () => {
    await seedCourse('c1', 'AGI Strategy');
    await seedExercise('ex1', { courseId: 'c1' });
    await seedUser('u-old', 'old@x.com');
    await seedUser('u-new', 'new@x.com');
    await completeExercise('old', 'u-old', 'ex1', '2026-01-01T00:00:00.000Z');
    await completeExercise('new', 'u-new', 'ex1', '2026-06-01T00:00:00.000Z');

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ since: '2026-03-01T00:00:00.000Z' });

    expect(ph.events.filter((e) => e.event === 'exercise_completed').map((e) => e.distinct_id)).toEqual(['sub-u-new']);
  });

  test('send-once across runs: a second run re-sends nothing', async () => {
    await seedCourse('c1', 'AGI Strategy');
    await seedExercise('ex1', { courseId: 'c1' });
    await seedUser('u1', 'a@x.com');
    await completeExercise('r1', 'u1', 'ex1', '2026-06-10T10:00:00.000Z');

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
  const seedUser = (id: string, email: string) => testDb.insert(userTable, {
    id, email, name: email, keycloakIdentifier: `sub-${id}`,
  });
  const completeResource = (
    id: string, userId: string | null, unitResourceId: string | null, completedAt: string | null,
    resourceId?: string,
  ) =>
    db.pg.insert(resourceCompletionPgTable.pg).values({
      id,
      userId: userId ? [userId] : null,
      unitResourceId,
      resourceId: resourceId ? [resourceId] : null,
      createdAt: '2026-06-01T00:00:00.000Z',
      completedAt,
    });

  test('emits one event per completed resource with the linked user\'s keycloak sub, enriched with the unit_resource and unit', async () => {
    await seedUnit('u1', { unitNumber: '2', title: 'What is AGI?' });
    await seedUnitResource('ur1', { unitId: 'u1', resourceName: 'The Bitter Lesson', coreFurtherMaybe: 'Core' });
    await seedUser('user1', 'a@x.com');
    await completeResource('rc1', 'user1', 'ur1', '2026-06-10T10:00:00.000Z', 'res1');

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const events = ph.events.filter((e) => e.event === 'resource_completed');
    expect(events).toHaveLength(1);
    // the user's keycloak sub, not any email
    expect(events[0]!.distinct_id).toBe('sub-user1');
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
    await seedUser('user1', 'a@x.com');
    await completeResource('rc1', 'user1', 'ur1', null);

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph.events.filter((e) => e.event === 'resource_completed')).toHaveLength(0);
  });

  test('skips completions without a linked user (nothing to attribute to)', async () => {
    await seedUnitResource('ur1', { unitId: 'u1' });
    await completeResource('rc1', null, 'ur1', '2026-06-10T10:00:00.000Z');

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph.events.filter((e) => e.event === 'resource_completed')).toHaveLength(0);
  });

  test('since scans only completions on/after it', async () => {
    await seedUnitResource('ur1', { unitId: 'u1' });
    await seedUser('u-old', 'old@x.com');
    await seedUser('u-new', 'new@x.com');
    await completeResource('old', 'u-old', 'ur1', '2026-01-01T00:00:00.000Z');
    await completeResource('new', 'u-new', 'ur1', '2026-06-01T00:00:00.000Z');

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ since: '2026-03-01T00:00:00.000Z' });

    expect(ph.events.filter((e) => e.event === 'resource_completed').map((e) => e.distinct_id)).toEqual(['sub-u-new']);
  });

  test('send-once across runs: a second run re-sends nothing', async () => {
    await seedUnitResource('ur1', { unitId: 'u1' });
    await seedUser('user1', 'a@x.com');
    await completeResource('rc1', 'user1', 'ur1', '2026-06-10T10:00:00.000Z');

    mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const ph2 = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph2.events.filter((e) => e.event === 'resource_completed')).toHaveLength(0);
  });
});

describe('project_submitted', () => {
  // distinct id (keycloak sub) and course/round are all resolved via the participant link, not stored on the row:
  // submission.participant -> meetPerson.userId -> user, and meetPerson.applicationsBaseRecordId -> course_registration.
  const seedRegisteredParticipant = async () => {
    await testDb.insert(courseTable, {
      id: 'c1', slug: 'agi-strategy', shortDescription: 'x', title: 'AGI Strategy', units: [], status: 'Active',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'cr1', courseId: 'c1', email: 'a@x.com', roundId: 'rd1', roundName: 'AGI Strategy (2026 Mar W14) - Intensive',
    });
    await testDb.insert(userTable, {
      id: 'u1', email: 'a@x.com', name: 'a', keycloakIdentifier: 'sub-u1',
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp1', userId: 'u1', applicationsBaseRecordId: 'cr1',
    });
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
    expect(events[0]!.distinct_id).toBe('sub-u1');
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

  test('emits with the identity but no course/round when the participant has no registration', async () => {
    await testDb.insert(userTable, {
      id: 'u2', email: 'solo@x.com', name: 'solo', keycloakIdentifier: 'sub-u2',
    });
    await testDb.insert(meetPersonTable, { id: 'mp2', userId: 'u2' }); // no applicationsBaseRecordId
    await testDb.insert(projectSubmissionTable, {
      id: 'ps1', createdAt: '2026-06-08T01:10:28.000Z', link: 'https://example.com/p', participant: ['mp2'],
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const event = ph.events.find((e) => e.event === 'project_submitted')!;
    expect(event.distinct_id).toBe('sub-u2');
    expect(event.properties).toMatchObject({ project_url: 'https://example.com/p' });
    expect(event.properties).not.toHaveProperty('course_id');
    expect(event.properties).not.toHaveProperty('round_id');
  });

  test('group projects fan out: one event per participant, each keyed and attributed separately', async () => {
    await seedRegisteredParticipant(); // mp1 -> sub-u1 (course c1, round rd1)
    await testDb.insert(userTable, {
      id: 'u2', email: 'b@x.com', name: 'b', keycloakIdentifier: 'sub-u2',
    });
    await testDb.insert(meetPersonTable, { id: 'mp2', userId: 'u2', applicationsBaseRecordId: 'cr1' });
    await testDb.insert(projectSubmissionTable, {
      id: 'ps1', createdAt: '2026-06-08T01:10:28.000Z', projectTitle: 'Group plan', participant: ['mp1', 'mp2'],
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const events = ph.events.filter((e) => e.event === 'project_submitted');
    expect(events.map((e) => e.distinct_id).sort()).toEqual(['sub-u1', 'sub-u2']);
    // distinct uuids (derived from the per-participant internalUniqueKey) so neither is dropped as a duplicate
    expect(new Set(events.map((e) => e.uuid)).size).toBe(2);
    expect(events.every((e) => e.properties.project_title === 'Group plan' && e.properties.course_id === 'c1')).toBe(true);
  });

  test('skips submissions whose participant resolves to no identity (nothing to attribute to)', async () => {
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
    await testDb.insert(userTable, {
      id: 'u-new', email: 'new@x.com', name: 'new', keycloakIdentifier: 'sub-u-new',
    });
    await testDb.insert(meetPersonTable, { id: 'mp2', userId: 'u-new' });
    await testDb.insert(projectSubmissionTable, {
      id: 'new', createdAt: '2026-06-01T00:00:00.000Z', participant: ['mp2'],
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog({ since: '2026-03-01T00:00:00.000Z' });

    expect(ph.events.filter((e) => e.event === 'project_submitted').map((e) => e.distinct_id)).toEqual(['sub-u-new']);
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
    expect(events[0]!.distinct_id).toBe('cr1');
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
    expect(ph.events.filter((e) => e.event === 'application_withdrawn').map((e) => e.distinct_id)).toEqual(['new']);
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
    await testDb.insert(userTable, {
      id: 'u1', email: 'a@x.com', name: 'a', keycloakIdentifier: 'sub-u1',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'cr1', courseId: 'c1', email: 'a@x.com', userId: 'u1', roundId: 'rd1', roundName: 'AGI Strategy (2026 Mar W14) - Intensive',
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
    expect(events[0]!.distinct_id).toBe('sub-u1');
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
    expect(deferred[0]!.distinct_id).toBe('sub-u1');
  });

  test('skips a dropout whose application cannot be resolved (no identity to attribute)', async () => {
    await seedDropout('do1', 'Drop out', { applicantId: 'missing' });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph.events.filter((e) => e.event === 'course_dropped_out')).toHaveLength(0);
  });

  test('falls back to the registration anchor when the applicant never logged in', async () => {
    await testDb.insert(courseRegistrationTable, { id: 'cr-nouser', courseId: 'c1', email: 'a@x.com' });
    await seedDropout('do1', 'Drop out', { applicantId: 'cr-nouser' });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();
    expect(ph.events.filter((e) => e.event === 'course_dropped_out').map((e) => e.distinct_id)).toEqual(['cr-nouser']);
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

describe('identity model: registration events share the anon anchor, identify joins it to the sub', () => {
  const seedCourse = () => testDb.insert(courseTable, {
    id: 'c1', slug: 'agi-strategy', shortDescription: 'x', title: 'AGI Strategy', units: [], status: 'Active',
  });

  test('logged-in applicant: submitted lands on the anchor, accepted on the sub, and the identify merges the two', async () => {
    await seedCourse();
    await testDb.insert(userTable, {
      id: 'u1', email: 'a@x.com', name: 'a', keycloakIdentifier: 'sub-u1', firstLoggedInAt: '2026-05-02T00:00:00.000Z',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'cr1', courseId: 'c1', email: 'a@x.com', userId: 'u1', posthogDistinctId: 'anon-1', createdAt: '2026-05-01T00:00:00.000Z', acceptedAt: '2026-05-03T00:00:00.000Z',
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    expect(ph.events.find((e) => e.event === 'application_submitted')!.distinct_id).toBe('anon-1');
    // decision events go straight to the sub once the user exists
    expect(ph.events.find((e) => e.event === 'application_accepted')!.distinct_id).toBe('sub-u1');
    // ...and the identify merges the anon anchor (submitted + any browsing) into that same sub person
    const identify = ph.events.find((e) => e.event === '$identify')!;
    expect(identify.distinct_id).toBe('sub-u1');
    expect(identify.properties.$anon_distinct_id).toBe('anon-1');
  });

  test('never-logged-in applicant: the whole funnel accumulates on one anon anchor, with no identify', async () => {
    await seedCourse();
    await testDb.insert(courseRegistrationTable, {
      id: 'cr1', courseId: 'c1', email: 'a@x.com', createdAt: '2026-05-01T00:00:00.000Z', rejectedAt: '2026-05-03T00:00:00.000Z',
    });

    const ph = mockPostHogBackend();
    await forwardAllEventsToPostHog();

    const funnel = ph.events.filter((e) => e.event.startsWith('application_'));
    expect(funnel).toHaveLength(2);
    expect(new Set(funnel.map((e) => e.distinct_id))).toEqual(new Set(['cr1']));
    expect(ph.events.filter((e) => e.event === '$identify')).toHaveLength(0);
  });
});

describe('identify_applicants', () => {
  const identifyApplicants = eventProjectionRules.find((p) => p.eventType === 'identify_applicants')!;

  const runIdentifyApplicants = (opts: { since?: string } = {}) => forwardEventTypeToPostHog({
    db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: identifyApplicants, since: opts.since, now: '2026-07-01T00:00:00.000Z',
  });

  const seedRegistration = (id: string, email: string, opts: { createdAt?: string; posthogDistinctId?: string; userId?: string } = {}) => (
    testDb.insert(courseRegistrationTable, {
      id, courseId: 'c1', email, createdAt: opts.createdAt ?? '2026-05-01T00:00:00.000Z', posthogDistinctId: opts.posthogDistinctId, userId: opts.userId,
    })
  );

  const seedLoggedInUser = (id: string, email: string, opts: { firstLoggedInAt?: string | null; keycloakIdentifier?: string | null } = {}) => testDb.insert(userTable, {
    id,
    email,
    name: email,
    firstLoggedInAt: opts.firstLoggedInAt === undefined ? '2026-05-02T00:00:00.000Z' : opts.firstLoggedInAt,
    keycloakIdentifier: opts.keycloakIdentifier === undefined ? `sub-${id}` : opts.keycloakIdentifier,
  });

  test('a new login joins an application created before `since`', async () => {
    await seedRegistration('cr1', 'a@x.com', { createdAt: '2026-01-01T00:00:00.000Z', posthogDistinctId: 'anon-1', userId: 'u1' });
    await seedLoggedInUser('u1', 'a@x.com', { firstLoggedInAt: '2026-06-01T00:00:00.000Z' });

    const ph = mockPostHogBackend();
    await runIdentifyApplicants({ since: '2026-03-01T00:00:00.000Z' });

    const identify = ph.events.find((e) => e.event === '$identify')!;
    expect(identify.distinct_id).toBe('sub-u1');
    expect(identify.properties).toMatchObject({ $anon_distinct_id: 'anon-1', $set: { email: 'a@x.com' } });
  });

  test('a new application joins a user who logged in before `since`', async () => {
    await seedLoggedInUser('u1', 'a@x.com', { firstLoggedInAt: '2026-01-01T00:00:00.000Z' });
    await seedRegistration('cr1', 'a@x.com', { createdAt: '2026-06-01T00:00:00.000Z', posthogDistinctId: 'anon-1', userId: 'u1' });

    const ph = mockPostHogBackend();
    await runIdentifyApplicants({ since: '2026-03-01T00:00:00.000Z' });

    const identify = ph.events.find((e) => e.event === '$identify')!;
    expect(identify.distinct_id).toBe('sub-u1');
    expect(identify.properties).toMatchObject({ $anon_distinct_id: 'anon-1' });
  });

  test('anchors on the registration record id when no posthogDistinctId was captured', async () => {
    await seedRegistration('cr-norec', 'b@x.com', { userId: 'u1' });
    await seedLoggedInUser('u1', 'b@x.com');

    const ph = mockPostHogBackend();
    await runIdentifyApplicants();

    expect(ph.events.find((e) => e.event === '$identify')!.properties).toMatchObject({ $anon_distinct_id: 'cr-norec' });
  });

  test('no-op when the application is not linked to a user', async () => {
    await seedRegistration('cr1', 'orphan@x.com', { posthogDistinctId: 'anon-1' });
    await seedLoggedInUser('u1', 'orphan@x.com');

    const ph = mockPostHogBackend();
    await runIdentifyApplicants();

    expect(ph.events).toHaveLength(0);
  });

  test('no-op when the linked user has never logged in', async () => {
    // user rows are created at apply time, before any login — that alone must not trigger a join
    await seedRegistration('cr1', 'a@x.com', { posthogDistinctId: 'anon-1', userId: 'u1' });
    await seedLoggedInUser('u1', 'a@x.com', { firstLoggedInAt: null });

    const ph = mockPostHogBackend();
    await runIdentifyApplicants();

    expect(ph.events).toHaveLength(0);
  });

  test('each application is joined at most once across runs', async () => {
    await seedRegistration('cr1', 'a@x.com', { posthogDistinctId: 'anon-1', userId: 'u1' });
    await seedLoggedInUser('u1', 'a@x.com');

    mockPostHogBackend();
    expect(await runIdentifyApplicants()).toMatchObject({ sent: 1 });

    const ph2 = mockPostHogBackend();
    expect(await runIdentifyApplicants()).toMatchObject({ sent: 0, alreadySent: 1 });
    expect(ph2.events).toHaveLength(0);
  });

  test('joins via userId, not email', async () => {
    await seedRegistration('cr1', 'old@x.com', { posthogDistinctId: 'anon-1', userId: 'u-linked' });
    await seedLoggedInUser('u-linked', 'new@x.com');
    await seedLoggedInUser('u-same-email', 'old@x.com');

    const ph = mockPostHogBackend();
    await runIdentifyApplicants();

    const identifies = ph.events.filter((e) => e.event === '$identify');
    expect(identifies).toHaveLength(1);
    expect(identifies[0]!.distinct_id).toBe('sub-u-linked');
  });

  test('skips the identify when the user has no keycloakIdentifier', async () => {
    await seedRegistration('cr1', 'a@x.com', { posthogDistinctId: 'anon-1', userId: 'u1' });
    await seedLoggedInUser('u1', 'a@x.com', { keycloakIdentifier: null });

    const ph = mockPostHogBackend();
    await runIdentifyApplicants();

    expect(ph.events).toHaveLength(0);
  });
});
