/* eslint-disable no-await-in-loop */
import {
  type PgAirtableDb, posthogEmittedEventsTable, inArray,
} from '@bluedot/db';
import { chunk } from '@bluedot/utils';
import { v5 as uuidv5 } from 'uuid';

/** A single logical event derived from source state. */
export type Event = {
  /** Unique within an event type. E.g. the record id of a course registration */
  internalUniqueKey: string;
  /** PostHog person key. */
  distinctId: string | null;
  timestampMs: number;
  properties: Record<string, unknown>;
};

/** One event type and how to derive it. */
export type EventProjectionRule = {
  eventType: string;
  calculateEvents: (db: PgAirtableDb, opts: { since?: string }) => Promise<Event[]>;
};

/** What we POST to PostHog. distinct_id + uuid are top-level (requirement for PostHog to join to user and dedup internally). */
export type PosthogEvent = {
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

export type ProjectionResult = {
  candidates: number; // total produced by calculateEvents
  skipped: number; // null/empty distinctId or non-finite timestamp
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
  db, posthogCredentials, eventProjectionRule, since, now = new Date().toISOString(),
}: {
  db: PgAirtableDb;
  posthogCredentials: PosthogCredentials;
  eventProjectionRule: EventProjectionRule;
  since?: string;
  now?: string;
}): Promise<ProjectionResult> {
  const { eventType: event } = eventProjectionRule;
  const batchUrl = `${posthogCredentials.host.replace(/\/$/, '')}/batch/`;
  const result: ProjectionResult = {
    candidates: 0, skipped: 0, alreadySent: 0, sent: 0, failedBatches: 0, errors: [],
  };

  // Step 1: Calculate events
  const candidateEvents = await eventProjectionRule.calculateEvents(db, { since });
  result.candidates = candidateEvents.length;

  const validCandidateEvents = candidateEvents.filter((c) => {
    const ok = c.distinctId != null && c.distinctId !== '' && Number.isFinite(c.timestampMs);
    if (!ok) result.skipped += 1;
    return ok;
  });

  // Step 2: Drop events that have already been sent (per our `posthogEmittedEventsTable`)
  const sentInternalUniqueKeys = new Set<string>();
  for (const keyChunk of chunk(validCandidateEvents.map((c) => c.internalUniqueKey), 10_000)) {
    const rows = await db.pg
      .select({ internalUniqueKey: posthogEmittedEventsTable.internalUniqueKey })
      .from(posthogEmittedEventsTable)
      .where(inArray(posthogEmittedEventsTable.id, keyChunk.map((k) => `${event}:${k}`)));

    for (const r of rows) {
      sentInternalUniqueKeys.add(r.internalUniqueKey);
    }
  }

  const eventsToSend = validCandidateEvents.filter((c) => !sentInternalUniqueKeys.has(c.internalUniqueKey));
  result.alreadySent = validCandidateEvents.length - eventsToSend.length;

  // Step 3: Send events to posthog in batches
  // historical_migration is per-request, so live (<=48h) and historical (>48h) can't share a batch.
  const nowMs = Date.parse(now);
  const partitions = [
    { group: eventsToSend.filter((c) => nowMs - c.timestampMs <= FORTY_EIGHT_HOURS_MS), historicalMigration: false },
    { group: eventsToSend.filter((c) => nowMs - c.timestampMs > FORTY_EIGHT_HOURS_MS), historicalMigration: true },
  ];

  const sendSingleBatch = async (batch: Event[], historicalMigration: boolean) => {
    const prepared = batch.map((c) => ({
      candidate: c,
      event: {
        event,
        distinct_id: c.distinctId!,
        uuid: deterministicUuid(`${event}:${c.internalUniqueKey}`),
        timestamp: new Date(c.timestampMs).toISOString(),
        properties: c.properties,
      } satisfies PosthogEvent,
    }));

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
      });
      if (!res.ok) {
        throw new Error(`PostHog /batch failed: ${res.status} ${res.statusText} ${await res.text().catch(() => '')}`);
      }

      await db.pg.insert(posthogEmittedEventsTable).values(prepared.map((p) => ({
        id: `${event}:${p.candidate.internalUniqueKey}`,
        event,
        internalUniqueKey: p.candidate.internalUniqueKey,
        externalUuid: p.event.uuid,
        eventTimestamp: new Date(p.candidate.timestampMs).toISOString(),
        distinctId: p.candidate.distinctId,
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
