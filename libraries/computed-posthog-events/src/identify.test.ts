import {
  createTestDbClients, PgAirtableDb, pushTestSchema, resetTestDb,
} from '@bluedot/db';
import {
  afterEach, beforeAll, beforeEach, describe, expect, test, vi,
} from 'vitest';
import {
  forwardEventTypeToPostHog, type Event, type EventProjectionRule, type PostHogEvent,
} from './core';
import { installPosthogBackend } from './__tests__/posthogBackend';

const POSTHOG_CREDS = { host: 'https://test.posthog', apiKey: 'phc_test' };
const NOW = '2026-06-17T00:00:00.000Z';
const OLD = '2026-01-01T00:00:00.000Z'; // >48h before NOW

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

// A projection returning fixed (track and/or identify) events.
const staticRule = (events: Event[]): EventProjectionRule => ({
  eventType: 'application_submitted',
  calculateEvents: async () => events,
});
const run = (events: Event[]) => forwardEventTypeToPostHog({
  db, posthogCredentials: POSTHOG_CREDS, eventProjectionRule: staticRule(events), now: NOW,
});

// Post a raw batch straight to the (stubbed) backend — used to model prior anonymous browsing.
const sendRaw = (batch: PostHogEvent[]) => fetch('https://test.posthog/batch/', {
  method: 'POST',
  body: JSON.stringify({ historical_migration: false, batch }),
});

const identify = (over: Partial<Event> = {}): Event => ({
  type: 'identify', internalUniqueKey: 'r1', distinctId: 'a@x.com', anonDistinctId: 'anon-1', timestampMs: Date.parse(NOW), set: { email: 'a@x.com' }, ...over,
} as Event);
const track = (over: Partial<Event> = {}): Event => ({
  internalUniqueKey: 'r1', distinctId: 'a@x.com', timestampMs: Date.parse(NOW), properties: { course: 'AGI Strategy' }, ...over,
} as Event);

describe('identify / merge', () => {
  test('a live identify merges the anonymous browser into the email person, sets props, and the track event lands on the merged person', async () => {
    const ph = installPosthogBackend();
    // anonymous browsing happened earlier (browser autocapture, logged out)
    await sendRaw([{
      event: '$pageview', distinct_id: 'anon-1', uuid: 'u0', timestamp: OLD, properties: { $session_id: 's1' },
    }]);
    expect(ph.isSamePerson('anon-1', 'a@x.com')).toBe(false);

    const result = await run([identify(), track()]);

    expect(result).toMatchObject({ candidates: 2, sent: 2, skipped: 0 });
    // the anonymous browsing is now stitched to the email person
    expect(ph.isSamePerson('anon-1', 'a@x.com')).toBe(true);
    // $set applied (live identify)
    expect(ph.personPropsFor('a@x.com')).toMatchObject({ email: 'a@x.com' });
    // the $identify wire event carries the merge shape
    const identifyEvent = ph.events.find((e) => e.event === '$identify')!;
    expect(identifyEvent.distinct_id).toBe('a@x.com');
    expect(identifyEvent.properties).toMatchObject({ $anon_distinct_id: 'anon-1', $set: { email: 'a@x.com' } });
    // the track event resolves to the same (merged) person as the anonymous browsing
    const submitted = ph.events.find((e) => e.event === 'application_submitted')!;
    expect(ph.personIdFor(submitted.distinct_id)).toBe(ph.personIdFor('anon-1'));
  });

  test('a backfilled (historical) track ships under historical_migration, while its identify is sent live so the merge still sets properties', async () => {
    const ph = installPosthogBackend();

    await run([
      identify({ timestampMs: Date.parse(OLD) }),
      track({ timestampMs: Date.parse(OLD) }),
    ]);

    const identifyBatch = ph.receivedBatches.find((b) => b.events.some((e) => e.event === '$identify'))!;
    const trackBatch = ph.receivedBatches.find((b) => b.events.some((e) => e.event === 'application_submitted'))!;
    expect(identifyBatch.historicalMigration).toBe(false); // identify is always live
    expect(trackBatch.historicalMigration).toBe(true); // the old track event is backfilled as historical
    // because the identify went live, the $set still applied
    expect(ph.isSamePerson('anon-1', 'a@x.com')).toBe(true);
    expect(ph.personPropsFor('a@x.com')).toMatchObject({ email: 'a@x.com' });
  });

  test('skips an identify missing the anonymous distinct id', async () => {
    const ph = installPosthogBackend();

    const result = await run([identify({ anonDistinctId: '' })]);

    expect(result).toMatchObject({ candidates: 1, skipped: 1, sent: 0 });
    expect(ph.events).toHaveLength(0);
  });

  test('identify and track are each logged once: a second run is a no-op', async () => {
    installPosthogBackend();
    const first = await run([identify(), track()]);
    expect(first).toMatchObject({ sent: 2, alreadySent: 0 });

    const ph2 = installPosthogBackend();
    const second = await run([identify(), track()]);
    expect(second).toMatchObject({ sent: 0, alreadySent: 2 });
    expect(ph2.events).toHaveLength(0);
  });
});
