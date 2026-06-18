/* eslint-disable no-await-in-loop */
import {
  type PgAirtableDb, posthogEmittedEventsTable, inArray,
} from '@bluedot/db';
import { chunk } from '@bluedot/utils';
import { v5 as uuidv5 } from 'uuid';

/** A track event: a normal analytics event (the default kind). `distinctId` is the PostHog person key. */
export type TrackEvent = {
  type?: 'track';
  /** Unique within an event type. E.g. the record id of a course registration */
  internalUniqueKey: string;
  distinctId: string | null;
  timestampMs: number;
  properties: Record<string, unknown>;
};

/**
 * An identify event: merges an anonymous distinct id into the identified one (e.g. an email).
 */
export type IdentifyEvent = {
  type: 'identify';
  internalUniqueKey: string;
  distinctId: string; // the identified id, e.g. email
  anonDistinctId: string; // merged into distinctId
  timestampMs: number;
  set?: Record<string, unknown>;
};

export type Event = TrackEvent | IdentifyEvent;

/** One event type and how to derive it. */
export type EventProjectionRule = {
  eventType: string;
  calculateEvents: (db: PgAirtableDb, opts: { since?: string; now: string }) => Promise<Event[]>;
};

/** What we POST to PostHog. distinct_id + uuid are top-level (requirement for PostHog to join to user and dedup internally). */
export type PostHogEvent = {
  event: string;
  distinct_id: string;
  uuid: string;
  timestamp: string; // ISO 8601
  properties: Record<string, unknown>;
};

export type PosthogCredentials = { host: string; apiKey: string };

const UUID_NAMESPACE = 'a3f1c8e2-7b4d-4a9c-8e1f-2d6b9c0a4e7f';
export const deterministicUuid = (name: string): string => uuidv5(name, UUID_NAMESPACE);

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
const BATCH_SIZE = 100; // events per PostHog /batch request

// Tag every emitted event so this backend's events are filterable in PostHog.
const EVENT_SOURCE = 'computed-posthog-events';

export type ProjectionResult = {
  candidates: number; // total produced by calculateEvents
  skipped: number; // malformed event
  alreadySent: number; // already in the log
  sent: number; // newly delivered + logged
  failedBatches: number; // batches whose send/log threw (events stay unlogged, retried next run)
  errors: unknown[];
};

/**
 * Process one EventProjectionRule: Compute its events, drop ones that are already-sent, send
 * the rest. Per-batch send/log failures are collected into `errors`; a failure
 * to *compute* the events (or read the log) throws.
 */
export async function forwardEventTypeToPostHog({
  db, posthogCredentials, eventProjectionRule, since, now = new Date().toISOString(), sourceVersion,
}: {
  db: PgAirtableDb;
  posthogCredentials: PosthogCredentials;
  eventProjectionRule: EventProjectionRule;
  since?: string;
  now?: string;
  sourceVersion?: string; // deploy version stamped onto every event (the pg-sync image's VERSION_TAG)
}): Promise<ProjectionResult> {
  const { eventType } = eventProjectionRule;
  const batchUrl = `${posthogCredentials.host.replace(/\/$/, '')}/batch/`;
  const result: ProjectionResult = {
    candidates: 0, skipped: 0, alreadySent: 0, sent: 0, failedBatches: 0, errors: [],
  };

  // A track event is sent under the rule's event type; an identify under PostHog's reserved `$identify`.
  const posthogEventName = (event: Event) => (event.type === 'identify' ? '$identify' : eventType);
  const postgresIdOfEvent = (event: Event) => `${posthogEventName(event)}:${event.internalUniqueKey}`;
  const isValid = (event: Event) => {
    if (!Number.isFinite(event.timestampMs)) return false;
    if (event.type === 'identify') return Boolean(event.distinctId) && Boolean(event.anonDistinctId);
    return event.distinctId != null && event.distinctId !== '';
  };

  // Step 1: Calculate events, dropping invalid ones
  const candidateEvents = await eventProjectionRule.calculateEvents(db, { since, now });
  result.candidates = candidateEvents.length;

  const validCandidateEvents = candidateEvents.filter((c) => {
    const ok = isValid(c);
    if (!ok) result.skipped += 1;
    return ok;
  });

  // Step 2: Drop events that have already been sent (per our `posthogEmittedEventsTable`)
  const sentPostgresIds = new Set<string>();
  for (const idChunk of chunk(validCandidateEvents.map(postgresIdOfEvent), 10_000)) {
    const rows = await db.pg
      .select({ id: posthogEmittedEventsTable.id })
      .from(posthogEmittedEventsTable)
      .where(inArray(posthogEmittedEventsTable.id, idChunk));

    for (const r of rows) {
      sentPostgresIds.add(r.id);
    }
  }

  const eventsToSend = validCandidateEvents.filter((c) => !sentPostgresIds.has(postgresIdOfEvent(c)));
  result.alreadySent = validCandidateEvents.length - eventsToSend.length;

  // Step 3: Send to PostHog in batches. historical_migration is per-request, so live (<=48h) and
  // historical (>48h) can't share a batch. Identify events always apply as-live (a historical identify
  // merges users for all time), so they're routed to the live partition regardless of timestamp.
  const nowMs = Date.parse(now);
  const isLive = (c: Event) => c.type === 'identify' || nowMs - c.timestampMs <= FORTY_EIGHT_HOURS_MS;
  const partitions = [
    { group: eventsToSend.filter((c) => isLive(c)), historicalMigration: false },
    { group: eventsToSend.filter((c) => !isLive(c)), historicalMigration: true },
  ];

  const sourceProps = { source: EVENT_SOURCE, ...(sourceVersion ? { source_version: sourceVersion } : {}) };
  const toPostHogEvent = (event: Event): PostHogEvent => {
    const uuid = deterministicUuid(postgresIdOfEvent(event));
    const timestamp = new Date(event.timestampMs).toISOString();
    if (event.type === 'identify') {
      return {
        event: '$identify',
        distinct_id: event.distinctId,
        uuid,
        timestamp,
        properties: { $anon_distinct_id: event.anonDistinctId, ...(event.set ? { $set: event.set } : {}), ...sourceProps },
      };
    }

    return {
      event: eventType, distinct_id: event.distinctId!, uuid, timestamp, properties: { ...event.properties, ...sourceProps },
    };
  };

  const sendSingleBatch = async (batch: Event[], historicalMigration: boolean) => {
    const prepared = batch.map((c) => ({ candidate: c, event: toPostHogEvent(c) }));

    try {
      // Send THEN log. A crash between leaves the chunk unlogged, so the next run re-sends it
      const res = await fetch(batchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: posthogCredentials.apiKey,
          historical_migration: historicalMigration,
          batch: prepared.map((p) => p.event),
        }),
        signal: AbortSignal.timeout(60_000), // don't let a hung request hold the cron's reentry guard
      });
      if (!res.ok) {
        throw new Error(`PostHog /batch failed: ${res.status} ${res.statusText} ${await res.text().catch(() => '')}`);
      }

      await db.pg.insert(posthogEmittedEventsTable).values(prepared.map((p) => ({
        id: postgresIdOfEvent(p.candidate),
        event: posthogEventName(p.candidate),
        internalUniqueKey: p.candidate.internalUniqueKey,
        externalUuid: p.event.uuid,
        eventTimestamp: new Date(p.candidate.timestampMs).toISOString(),
        distinctId: p.event.distinct_id, // non-null: the id we actually sent (validation dropped null ones)
      }))).onConflictDoNothing();

      result.sent += prepared.length;
    } catch (err) {
      result.failedBatches += 1;
      result.errors.push(err);
    }
  };

  for (const { group, historicalMigration } of partitions) {
    for (const batch of chunk(group, BATCH_SIZE)) {
      await sendSingleBatch(batch, historicalMigration);
    }
  }

  return result;
}
