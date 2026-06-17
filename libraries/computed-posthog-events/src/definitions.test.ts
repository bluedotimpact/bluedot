import {
  createTestDbClients, PgAirtableDb, pushTestSchema, resetTestDb,
  courseRegistrationTable, selfServeCourseRegistrationTable,
  groupDiscussionTable, meetPersonTable, eq,
} from '@bluedot/db';
import {
  beforeAll, beforeEach, describe, expect, test,
} from 'vitest';
import { shipEventType, type PosthogClient, type PosthogEvent } from './core';
import { projections } from './definitions';

let db: PgAirtableDb;

beforeAll(async () => {
  const { pgClient, airtableClient } = createTestDbClients();
  db = new PgAirtableDb({
    pgConnString: 'unused', airtableApiKey: 'unused', pgClient, airtableClient,
  });
  await pushTestSchema(db);
});
beforeEach(async () => resetTestDb(db));

function makeFakePosthog() {
  const events: PosthogEvent[] = [];
  const client: PosthogClient = {
    async sendBatch(batch) {
      events.push(...batch);
    },
  };
  return { client, events };
}

// Run every projection, the way the cron loops them.
const runAll = async (posthog: PosthogClient, opts: { since?: string; now?: string } = {}) => {
  const now = opts.now ?? '2026-07-01T00:00:00.000Z';
  for (const projection of projections) {
    // eslint-disable-next-line no-await-in-loop
    await shipEventType({
      db, posthog, eventProjectionRule: projection, since: opts.since, now,
    });
  }
};

// Run a single projection by event name and return its result (for asserting per-event stats).
const runOne = (posthog: PosthogClient, event: string, opts: { since?: string; now?: string } = {}) => shipEventType({
  db, posthog, eventProjectionRule: projections.find((p) => p.eventType === event)!, since: opts.since, now: opts.now ?? '2026-07-01T00:00:00.000Z',
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
    await runAll(ph.client);

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
    await runAll(ph.client, { since: '2022-01-01T00:00:00.000Z' });
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
    await runAll(ph.client, { since: '2026-03-01T00:00:00.000Z' });
    expect(eventsOf(ph.events, 'application_accepted').map((e) => e.distinct_id)).toEqual(['new@x.com']);
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
    await runAll(ph.client);

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
    await runAll(ph.client);
    expect(eventsOf(ph.events, 'application_accepted')).toHaveLength(1);

    // `Accepted at` is write-once in Airtable, but even if it somehow moved, the log prevents re-emit.
    await db.pg.update(courseRegistrationTable.pg)
      .set({ acceptedAt: '2026-06-20T12:00:00.000Z' })
      .where(eq(courseRegistrationTable.pg.id, 'a1'));

    await runAll(ph.client);
    expect(eventsOf(ph.events, 'application_accepted')).toHaveLength(1);
    expect(eventsOf(ph.events, 'application_accepted')[0]?.timestamp).toBe('2026-06-01T10:00:00.000Z');
  });
});

describe('discussion_attended (fan-out + distinct_id lookup)', () => {
  const START = 1_746_090_000; // epoch seconds
  const START_ISO = new Date(START * 1000).toISOString();

  test('one event per resolvable attendee; unresolved attendees are skipped', async () => {
    await db.pg.insert(groupDiscussionTable.pg).values({
      id: 'd1',
      attendees: ['p1', 'p2', 'p3'],
      startDateTime: START,
      round: 'rd1',
      facilitators: [],
      participantsExpected: [],
      endDateTime: START,
      group: 'g1',
    });
    await db.pg.insert(meetPersonTable.pg).values([
      { id: 'p1', email: 'p1@x.com' },
      { id: 'p2', email: 'p2@x.com' },
      // p3 has no meetPerson -> no email -> skipped
    ]);

    const ph = makeFakePosthog();
    const result = await runOne(ph.client, 'discussion_attended');

    const attended = eventsOf(ph.events, 'discussion_attended');
    expect(attended.map((e) => e.distinct_id).sort()).toEqual(['p1@x.com', 'p2@x.com']);
    expect(attended.every((e) => e.timestamp === START_ISO)).toBe(true);
    expect(result).toMatchObject({ candidates: 3, skipped: 1, sent: 2 });
  });

  test('incremental: a newly-added attendee emits on the next run, existing ones do not', async () => {
    await db.pg.insert(groupDiscussionTable.pg).values({
      id: 'd1',
      attendees: ['p1'],
      startDateTime: START,
      facilitators: [],
      participantsExpected: [],
      endDateTime: START,
      group: 'g1',
    });
    await db.pg.insert(meetPersonTable.pg).values([
      { id: 'p1', email: 'p1@x.com' },
      { id: 'p4', email: 'p4@x.com' },
    ]);

    const ph = makeFakePosthog();
    await runAll(ph.client);
    expect(eventsOf(ph.events, 'discussion_attended')).toHaveLength(1);

    await db.pg.update(groupDiscussionTable.pg)
      .set({ attendees: ['p1', 'p4'] })
      .where(eq(groupDiscussionTable.pg.id, 'd1'));

    const result = await runOne(ph.client, 'discussion_attended');
    expect(result).toMatchObject({ alreadySent: 1, sent: 1 });
    expect(eventsOf(ph.events, 'discussion_attended').map((e) => e.distinct_id).sort())
      .toEqual(['p1@x.com', 'p4@x.com']);
  });
});
