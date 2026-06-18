import {
  posthogEmittedEventsTable, eq,
} from '@bluedot/db';
import {
  afterEach, describe, expect, test, vi,
} from 'vitest';
import {
  forwardEventTypeToPostHog, deterministicUuid,
  type Event, type TrackEvent, type EventProjectionRule,
} from './core';
import { mockPostHogBackend } from './__tests__/posthogBackend';
import { db, setupTestDb } from './__tests__/dbTestUtils';

const POSTHOG_CREDS = { host: 'https://test.posthog', apiKey: 'phc_test' };

setupTestDb();
afterEach(() => vi.unstubAllGlobals());

// A projection that just returns fixed candidates, so tests feed the runner controlled input
// while still exercising the real PGlite-backed log.
const staticEventProjectionRule = (event: string, candidates: Event[]): EventProjectionRule => ({
  eventType: event,
  calculateEvents: async () => candidates,
});

const candidateEvent = (override: Partial<TrackEvent> = {}): TrackEvent => ({
  internalUniqueKey: 'k1', distinctId: 'a@example.com', timestampMs: 1_000_000, properties: {}, ...override,
});

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
    const ph = mockPostHogBackend();
    const projection = staticEventProjectionRule('certificate_issued', [candidateEvent({ internalUniqueKey: 'r1' }), candidateEvent({ internalUniqueKey: 'r2' })]);

    const first = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(first).toMatchObject({ candidates: 2, sent: 2, alreadySent: 0 });
    expect(await db.pg.select().from(posthogEmittedEventsTable)).toHaveLength(2);

    const second = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(second).toMatchObject({ sent: 0, alreadySent: 2 });
    expect(ph.events).toHaveLength(2); // nothing new sent
  });

  test('skips candidates with null/empty distinctId or non-finite timestamp', async () => {
    const ph = mockPostHogBackend();
    const projection = staticEventProjectionRule('e', [
      candidateEvent({ internalUniqueKey: 'ok' }),
      candidateEvent({ internalUniqueKey: 'no-email', distinctId: null }),
      candidateEvent({ internalUniqueKey: 'blank', distinctId: '' }),
      candidateEvent({ internalUniqueKey: 'bad-ts', timestampMs: NaN }),
    ]);

    const result = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(result).toMatchObject({ candidates: 4, skipped: 3, sent: 1 });
    expect(ph.events.map((e) => e.distinct_id)).toEqual(['a@example.com']);
  });

  test('skips an identify event missing its anonymous distinct id', async () => {
    const ph = mockPostHogBackend();
    const projection = staticEventProjectionRule('application_submitted', [{
      type: 'identify', internalUniqueKey: 'no-anon', distinctId: 'a@x.com', anonDistinctId: '', timestampMs: 1_000_000, set: { email: 'a@x.com' },
    }]);

    const result = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(result).toMatchObject({ candidates: 1, skipped: 1, sent: 0 });
    expect(ph.events).toHaveLength(0);
  });

  test('fan-out: one projection returning N candidates yields N distinct-key events', async () => {
    mockPostHogBackend();
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
    expect((await db.pg.select().from(posthogEmittedEventsTable)).map((r) => r.internalUniqueKey).sort()).toEqual(['d1:p1', 'd1:p2', 'd1:p3']);
  });

  test('stamps every event with source, and source_version when provided', async () => {
    const ph = mockPostHogBackend();
    const projection = staticEventProjectionRule('e', [candidateEvent({ internalUniqueKey: 'k' })]);

    await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, sourceVersion: '20260618.120000.abc1234', now: '2026-01-01T00:00:00.000Z',
    });
    expect(ph.events[0]?.properties).toMatchObject({ source: 'computed-posthog-events', source_version: '20260618.120000.abc1234' });
  });

  test('partitions live (<=48h) and historical (>48h) into separate batches with the right flag', async () => {
    const ph = mockPostHogBackend();
    const nowMs = 1_000 * 60 * 60 * 24 * 10;
    const live = nowMs - (10 * 60 * 60 * 1000); // 10h old
    const old = nowMs - (10 * 24 * 60 * 60 * 1000); // 10d old
    const projection = staticEventProjectionRule('e', [candidateEvent({ internalUniqueKey: 'live', timestampMs: live }), candidateEvent({ internalUniqueKey: 'old', timestampMs: old })]);

    await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: new Date(nowMs).toISOString(),
    });

    const liveCall = ph.receivedBatches.find((c) => !c.historicalMigration);
    const histCall = ph.receivedBatches.find((c) => c.historicalMigration);
    expect(liveCall?.events[0]?.timestamp).toBe(new Date(live).toISOString());
    expect(histCall?.events[0]?.timestamp).toBe(new Date(old).toISOString());
  });

  test('a send failure is collected (not thrown), leaving the batch unlogged for next run', async () => {
    const ph = mockPostHogBackend();
    const projection = staticEventProjectionRule('e', [candidateEvent({ internalUniqueKey: 'k' })]);

    ph.failNextSends(1);
    const first = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(first).toMatchObject({ sent: 0, failedBatches: 1 });
    expect(first.errors).toHaveLength(1);
    expect(await db.pg.select().from(posthogEmittedEventsTable)).toHaveLength(0);

    const second = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(second).toMatchObject({ sent: 1 });
    expect(await db.pg.select().from(posthogEmittedEventsTable)).toHaveLength(1);
  });

  test('a calculateEvents failure throws — the cron loop isolates it per projection', async () => {
    mockPostHogBackend();
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
    const ph = mockPostHogBackend();
    await db.pg.insert(posthogEmittedEventsTable).values({
      id: 'e:already', event: 'e', internalUniqueKey: 'already', externalUuid: 'x', eventTimestamp: new Date(1).toISOString(), distinctId: 'a@x.com',
    });
    const projection = staticEventProjectionRule('e', [candidateEvent({ internalUniqueKey: 'already' }), candidateEvent({ internalUniqueKey: 'fresh' })]);

    const result = await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(result).toMatchObject({ alreadySent: 1, sent: 1 });
    expect(ph.events).toHaveLength(1);
  });

  test('dedup backstop: if the log is lost, the re-send carries an identical uuid', async () => {
    const ph = mockPostHogBackend();
    const projection = staticEventProjectionRule('e', [candidateEvent({ internalUniqueKey: 'k', timestampMs: 1_234 })]);

    await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    const firstUuid = ph.events[0]?.uuid;

    await db.pg.delete(posthogEmittedEventsTable).where(eq(posthogEmittedEventsTable.event, 'e'));

    await forwardEventTypeToPostHog({
      db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: projection, now: '2026-01-01T00:00:00.000Z',
    });
    expect(ph.events[1]?.uuid).toBe(firstUuid);
  });

  test('passes `since` through to the projection', async () => {
    mockPostHogBackend();
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
