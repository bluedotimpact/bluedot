import {
  createTestDbClients, PgAirtableDb, pushTestSchema, resetTestDb,
  posthogEmittedEventsTable, eq,
} from '@bluedot/db';
import {
  afterEach, beforeAll, beforeEach, describe, expect, test, vi,
} from 'vitest';
import {
  forwardEventTypeToPostHog, deterministicUuid,
  type Event, type EventProjectionRule, type PosthogEvent,
} from './core';

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

// Stub global fetch to record the /batch posts; can be told to fail the next N sends.
function makeFakePosthog() {
  const calls: { events: PosthogEvent[]; historicalMigration: boolean }[] = [];
  let failNext = 0;
  vi.stubGlobal('fetch', async (_url: string, init: { body: string }) => {
    if (failNext > 0) {
      failNext -= 1;
      return new Response('posthog down', { status: 500 });
    }

    const body = JSON.parse(init.body);
    calls.push({ events: body.batch, historicalMigration: body.historical_migration });
    return new Response(JSON.stringify({ status: 'Ok' }), { status: 200 });
  });
  return {
    calls,
    failNextSends: (n: number) => {
      failNext = n;
    },
    events: () => calls.flatMap((c) => c.events),
  };
}

// A projection that just returns fixed candidates, so tests feed the runner controlled input
// while still exercising the real PGlite-backed log.
const staticEventProjectionRule = (event: string, candidates: Event[]): EventProjectionRule => ({
  eventType: event,
  calculateEvents: async () => candidates,
});

const candidate = (over: Partial<Event> = {}): Event => ({
  internalUniqueKey: 'k1', distinctId: 'a@example.com', timestampMs: 1_000_000, properties: {}, ...over,
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

describe('runProjection', () => {
  test('emits one event per candidate, logs them, second run is a no-op', async () => {
    const ph = makeFakePosthog();
    const projection = staticEventProjectionRule('certificate_issued', [candidate({ internalUniqueKey: 'r1' }), candidate({ internalUniqueKey: 'r2' })]);

    const first = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(first).toMatchObject({ candidates: 2, sent: 2, alreadySent: 0 });
    expect(await logRows()).toHaveLength(2);

    const second = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(second).toMatchObject({ sent: 0, alreadySent: 2 });
    expect(ph.events()).toHaveLength(2); // nothing new sent
  });

  test('skips candidates with null/empty distinctId or non-finite timestamp', async () => {
    const ph = makeFakePosthog();
    const projection = staticEventProjectionRule('e', [
      candidate({ internalUniqueKey: 'ok' }),
      candidate({ internalUniqueKey: 'no-email', distinctId: null }),
      candidate({ internalUniqueKey: 'blank', distinctId: '' }),
      candidate({ internalUniqueKey: 'bad-ts', timestampMs: NaN }),
    ]);

    const result = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(result).toMatchObject({ candidates: 4, skipped: 3, sent: 1 });
    expect(ph.events().map((e) => e.distinct_id)).toEqual(['a@example.com']);
  });

  test('fan-out: one projection returning N candidates yields N distinct-key events', async () => {
    makeFakePosthog();
    const projection: EventProjectionRule = {
      eventType: 'discussion_attended',
      calculateEvents: async () => ['p1', 'p2', 'p3'].map((p) => ({
        internalUniqueKey: `d1:${p}`, distinctId: `${p}@x.com`, timestampMs: 1_000_000, properties: {},
      })),
    };
    const result = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(result).toMatchObject({ candidates: 3, sent: 3 });
    expect((await logRows()).map((r) => r.internalUniqueKey).sort()).toEqual(['d1:p1', 'd1:p2', 'd1:p3']);
  });

  test('partitions live (<=48h) and historical (>48h) into separate batches with the right flag', async () => {
    const ph = makeFakePosthog();
    const nowMs = 1_000 * 60 * 60 * 24 * 10;
    const live = nowMs - (10 * 60 * 60 * 1000); // 10h old
    const old = nowMs - (10 * 24 * 60 * 60 * 1000); // 10d old
    const projection = staticEventProjectionRule('e', [candidate({ internalUniqueKey: 'live', timestampMs: live }), candidate({ internalUniqueKey: 'old', timestampMs: old })]);

    await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: new Date(nowMs).toISOString(),
    });

    const liveCall = ph.calls.find((c) => !c.historicalMigration);
    const histCall = ph.calls.find((c) => c.historicalMigration);
    expect(liveCall?.events[0]?.timestamp).toBe(new Date(live).toISOString());
    expect(histCall?.events[0]?.timestamp).toBe(new Date(old).toISOString());
  });

  test('a send failure is collected (not thrown), leaving the batch unlogged for next run', async () => {
    const ph = makeFakePosthog();
    const projection = staticEventProjectionRule('e', [candidate({ internalUniqueKey: 'k' })]);

    ph.failNextSends(1);
    const first = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(first).toMatchObject({ sent: 0, failedBatches: 1 });
    expect(first.errors).toHaveLength(1);
    expect(await logRows()).toHaveLength(0);

    const second = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(second).toMatchObject({ sent: 1 });
    expect(await logRows()).toHaveLength(1);
  });

  test('a calculateEvents failure throws — the cron loop isolates it per projection', async () => {
    makeFakePosthog();
    const projection: EventProjectionRule = {
      eventType: 'boom',
      calculateEvents: async () => {
        throw new Error('query failed');
      },
    };
    await expect(forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    })).rejects.toThrow('query failed');
  });

  test('anti-join: a pre-logged key is not re-sent; a fresh key alongside it is', async () => {
    const ph = makeFakePosthog();
    await db.pg.insert(posthogEmittedEventsTable).values({
      id: 'e:already', event: 'e', internalUniqueKey: 'already', externalUuid: 'x', eventTimestamp: new Date(1).toISOString(), distinctId: 'a@x.com',
    });
    const projection = staticEventProjectionRule('e', [candidate({ internalUniqueKey: 'already' }), candidate({ internalUniqueKey: 'fresh' })]);

    const result = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(result).toMatchObject({ alreadySent: 1, sent: 1 });
    expect(ph.events()).toHaveLength(1);
  });

  test('dedup backstop: if the log is lost, the re-send carries an identical uuid', async () => {
    const ph = makeFakePosthog();
    const projection = staticEventProjectionRule('e', [candidate({ internalUniqueKey: 'k', timestampMs: 1_234 })]);

    await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    const firstUuid = ph.events()[0]?.uuid;

    await db.pg.delete(posthogEmittedEventsTable).where(eq(posthogEmittedEventsTable.event, 'e'));

    await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(ph.events()[1]?.uuid).toBe(firstUuid);
  });

  test('passes `since` through to the projection', async () => {
    makeFakePosthog();
    let seen: string | undefined = 'unset';
    const projection: EventProjectionRule = {
      eventType: 'e',
      calculateEvents: async (_db, opts) => {
        seen = opts.since;
        return [];
      },
    };
    await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, since: '2026-01-01T00:00:00.000Z', now: '2026-01-01T00:00:00.000Z',
    });
    expect(seen).toBe('2026-01-01T00:00:00.000Z');
  });
});
