import {
  createTestDbClients, PgAirtableDb, pushTestSchema, resetTestDb,
  posthogEmittedEventsTable, eq,
} from '@bluedot/db';
import {
  beforeAll, beforeEach, describe, expect, test,
} from 'vitest';
import {
  runProjections, deterministicUuid,
  type Candidate, type Projection, type PosthogClient, type PosthogEvent,
} from './core';

let db: PgAirtableDb;

beforeAll(async () => {
  const { pgClient, airtableClient } = createTestDbClients();
  db = new PgAirtableDb({
    pgConnString: 'unused', airtableApiKey: 'unused', pgClient, airtableClient,
  });
  await pushTestSchema(db);
});
beforeEach(async () => resetTestDb(db));

// Fake PostHog client: records batches; can be told to fail the next N sends.
function makeFakePosthog() {
  const calls: { events: PosthogEvent[]; historicalMigration: boolean }[] = [];
  let failNext = 0;
  const client: PosthogClient = {
    async sendBatch(events, opts) {
      if (failNext > 0) {
        failNext -= 1;
        throw new Error('posthog down');
      }

      calls.push({ events: [...events], historicalMigration: opts.historicalMigration });
    },
  };
  return {
    client,
    calls,
    failNextSends: (n: number) => {
      failNext = n;
    },
    events: () => calls.flatMap((c) => c.events),
  };
}

// A projection that just returns fixed candidates, so tests feed the runner controlled input
// while still exercising the real PGlite-backed log.
const feed = (event: string, candidates: Candidate[]): Projection => ({
  event,
  calculateEvents: async () => candidates,
});

const candidate = (over: Partial<Candidate> = {}): Candidate => ({
  key: 'k1', distinctId: 'a@example.com', timestampMs: 1_000_000, properties: {}, ...over,
});
const logRows = () => db.pg.select().from(posthogEmittedEventsTable);

describe('deterministicUuid', () => {
  test('is a valid v5 UUID and stable per name', () => {
    expect(deterministicUuid('certificate_issued:rec1'))
      .toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(deterministicUuid('a:b')).toBe(deterministicUuid('a:b'));
    expect(deterministicUuid('a:b')).not.toBe(deterministicUuid('a:c'));
  });
});

describe('runProjections', () => {
  test('emits one event per candidate, logs them, second run is a no-op', async () => {
    const ph = makeFakePosthog();
    const projections = [feed('certificate_issued', [candidate({ key: 'r1' }), candidate({ key: 'r2' })])];

    const first = await runProjections({
      db, posthog: ph.client, projections, now: 2_000_000,
    });
    expect(first.byEvent.certificate_issued).toMatchObject({ candidates: 2, sent: 2, alreadySent: 0 });
    expect(await logRows()).toHaveLength(2);

    const second = await runProjections({
      db, posthog: ph.client, projections, now: 2_000_000,
    });
    expect(second.byEvent.certificate_issued).toMatchObject({ sent: 0, alreadySent: 2 });
    expect(ph.events()).toHaveLength(2); // nothing new sent
  });

  test('skips candidates with null/empty distinctId or non-finite timestamp', async () => {
    const ph = makeFakePosthog();
    const projections = [feed('e', [
      candidate({ key: 'ok' }),
      candidate({ key: 'no-email', distinctId: null }),
      candidate({ key: 'blank', distinctId: '' }),
      candidate({ key: 'bad-ts', timestampMs: NaN }),
    ])];

    const stats = await runProjections({
      db, posthog: ph.client, projections, now: 2_000_000,
    });
    expect(stats.byEvent.e).toMatchObject({ candidates: 4, skipped: 3, sent: 1 });
    expect(ph.events().map((e) => e.distinct_id)).toEqual(['a@example.com']);
  });

  test('fan-out: one projection returning N candidates yields N distinct-key events', async () => {
    const ph = makeFakePosthog();
    const projection: Projection = {
      event: 'discussion_attended',
      calculateEvents: async () => ['p1', 'p2', 'p3'].map((p) => ({
        key: `d1:${p}`, distinctId: `${p}@x.com`, timestampMs: 1_000_000, properties: {},
      })),
    };
    const stats = await runProjections({
      db, posthog: ph.client, projections: [projection], now: 2_000_000,
    });
    expect(stats.byEvent.discussion_attended).toMatchObject({ candidates: 3, sent: 3 });
    expect((await logRows()).map((r) => r.internalUniqueKey).sort()).toEqual(['d1:p1', 'd1:p2', 'd1:p3']);
  });

  test('two projections sharing one event name sum under it, with distinct keys', async () => {
    const ph = makeFakePosthog();
    const projections = [
      feed('certificate_issued', [candidate({ key: 'a' })]),
      feed('certificate_issued', [candidate({ key: 'b' })]),
    ];

    const stats = await runProjections({
      db, posthog: ph.client, projections, now: 2_000_000,
    });
    expect(stats.byEvent.certificate_issued).toMatchObject({ candidates: 2, sent: 2 });
    expect((await logRows()).map((r) => r.internalUniqueKey).sort()).toEqual(['a', 'b']);
  });

  test('partitions live (<=48h) and historical (>48h) into separate batches with the right flag', async () => {
    const ph = makeFakePosthog();
    const now = 1_000 * 60 * 60 * 24 * 10;
    const live = now - (10 * 60 * 60 * 1000); // 10h old
    const old = now - (10 * 24 * 60 * 60 * 1000); // 10d old
    const projections = [feed('e', [candidate({ key: 'live', timestampMs: live }), candidate({ key: 'old', timestampMs: old })])];

    await runProjections({
      db, posthog: ph.client, projections, now,
    });

    const liveCall = ph.calls.find((c) => !c.historicalMigration);
    const histCall = ph.calls.find((c) => c.historicalMigration);
    expect(liveCall?.events[0]?.timestamp).toBe(new Date(live).toISOString());
    expect(histCall?.events[0]?.timestamp).toBe(new Date(old).toISOString());
  });

  test('send failure leaves the batch unlogged and retried next run (never log before send)', async () => {
    const ph = makeFakePosthog();
    const projections = [feed('e', [candidate({ key: 'k' })])];

    ph.failNextSends(1);
    const first = await runProjections({
      db, posthog: ph.client, projections, now: 2_000_000,
    });
    expect(first.byEvent.e).toMatchObject({ sent: 0, failedBatches: 1 });
    expect(await logRows()).toHaveLength(0);

    const second = await runProjections({
      db, posthog: ph.client, projections, now: 2_000_000,
    });
    expect(second.byEvent.e).toMatchObject({ sent: 1 });
    expect(await logRows()).toHaveLength(1);
  });

  test('anti-join: a pre-logged key is not re-sent; a fresh key alongside it is', async () => {
    const ph = makeFakePosthog();
    await db.pg.insert(posthogEmittedEventsTable).values({
      id: 'e:already', event: 'e', internalUniqueKey: 'already', externalUuid: 'x', eventTimestamp: new Date(1).toISOString(), distinctId: 'a@x.com',
    });
    const projections = [feed('e', [candidate({ key: 'already' }), candidate({ key: 'fresh' })])];

    const stats = await runProjections({
      db, posthog: ph.client, projections, now: 2_000_000,
    });
    expect(stats.byEvent.e).toMatchObject({ alreadySent: 1, sent: 1 });
    expect(ph.events()).toHaveLength(1);
  });

  test('dedup backstop: if the log is lost, the re-send carries an identical uuid', async () => {
    const ph = makeFakePosthog();
    const projections = [feed('e', [candidate({ key: 'k', timestampMs: 1_234 })])];

    await runProjections({
      db, posthog: ph.client, projections, now: 2_000_000,
    });
    const firstUuid = ph.events()[0]?.uuid;

    await db.pg.delete(posthogEmittedEventsTable).where(eq(posthogEmittedEventsTable.event, 'e'));

    await runProjections({
      db, posthog: ph.client, projections, now: 2_000_000,
    });
    expect(ph.events()[1]?.uuid).toBe(firstUuid);
  });

  test('passes `since` through to each projection', async () => {
    const ph = makeFakePosthog();
    let seen: number | undefined = -1;
    const projection: Projection = {
      event: 'e',
      calculateEvents: async (_db, opts) => {
        seen = opts.since;
        return [];
      },
    };
    await runProjections({
      db, posthog: ph.client, projections: [projection], since: 12_345, now: 2_000_000,
    });
    expect(seen).toBe(12_345);
  });

  test('one projection failing does not stop the others', async () => {
    const ph = makeFakePosthog();
    ph.failNextSends(1);
    const projections = [feed('a', [candidate({ key: 'ka' })]), feed('b', [candidate({ key: 'kb' })])];

    const stats = await runProjections({
      db, posthog: ph.client, projections, now: 2_000_000,
    });
    expect(stats.byEvent.a).toMatchObject({ sent: 0, failedBatches: 1 });
    expect(stats.byEvent.b).toMatchObject({ sent: 1 });
  });
});
