/* eslint-disable no-await-in-loop */
import {
  type PgAirtableDb, posthogEmittedEventsTable, inArray,
} from '@bluedot/db';
import { v5 as uuidv5 } from 'uuid';

/** A single logical event derived from source state. */
export type Candidate = {
  /** Unique within an event type. Carries source/array discriminators, e.g. `selfServe:rec123`. */
  key: string;
  /** PostHog person key. Null/empty candidates are skipped (and counted). */
  distinctId: string | null;
  /** Event time, ms since epoch. Non-finite candidates are skipped. */
  timestampMs: number;
  properties: Record<string, unknown>;
};

/**
 * One event type and how to derive it. Definitions live inline in a `Projection[]` (nothing to
 * remember to add to an export list); several entries may share an `event` if you'd rather not
 * merge wildly different sources into one function.
 */
export type Projection = {
  event: string;
  /**
   * Produce every event for this projection. `since` (epoch ms) bounds the scan to recently-changed
   * rows; undefined means all-time (backfill). May read several tables and fan out — it returns the
   * finished candidates, so there's no row/event type boundary.
   */
  calculateEvents: (db: PgAirtableDb, opts: { since?: number }) => Promise<Candidate[]>;
};

/** What we POST to PostHog. distinct_id + uuid are top-level (PostHog dedup requirement). */
export type PosthogEvent = {
  event: string;
  distinct_id: string;
  uuid: string;
  timestamp: string; // ISO 8601
  properties: Record<string, unknown>;
};

export type PosthogClient = {
  sendBatch: (events: PosthogEvent[], opts: { historicalMigration: boolean }) => Promise<void>;
};

// Fixed namespace for all bluedot analytics event UUIDs (a hardcoded random UUID). Deterministic
// so a re-sent event keeps its identity and PostHog can dedup it.
const UUID_NAMESPACE = 'a3f1c8e2-7b4d-4a9c-8e1f-2d6b9c0a4e7f';
export const deterministicUuid = (name: string): string => uuidv5(name, UUID_NAMESPACE);

export type PosthogClientConfig = { host: string; apiKey: string; fetchImpl?: typeof fetch };

/** Thin client over PostHog's /batch endpoint. historical_migration is a per-request flag. */
export function createPosthogClient(config: PosthogClientConfig): PosthogClient {
  const doFetch = config.fetchImpl ?? fetch;
  const url = `${config.host.replace(/\/$/, '')}/batch/`;
  return {
    async sendBatch(events, { historicalMigration }) {
      if (events.length === 0) return;
      const res = await doFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: config.apiKey, historical_migration: historicalMigration, batch: events }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`PostHog /batch failed: ${res.status} ${res.statusText} ${body}`);
      }
    },
  };
}

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
const BATCH_SIZE = 100;

function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

/** Keys (of the given candidate set) already emitted for this event — the send-once anti-join. */
async function getSentKeys(db: PgAirtableDb, event: string, keys: string[]): Promise<Set<string>> {
  const found = new Set<string>();
  for (const keyChunk of chunk(keys, 500)) {
    // Look up by the `${event}:${key}` primary key so this hot path uses the PK index.
    const rows = await db.pg
      .select({ internalUniqueKey: posthogEmittedEventsTable.internalUniqueKey })
      .from(posthogEmittedEventsTable)
      .where(inArray(posthogEmittedEventsTable.id, keyChunk.map((k) => `${event}:${k}`)));
    for (const r of rows) found.add(r.internalUniqueKey);
  }

  return found;
}

export type EventStats = {
  candidates: number; skipped: number; alreadySent: number; sent: number; failedBatches: number;
};
export type RunStats = { byEvent: Record<string, EventStats>; errors: unknown[] };

/**
 * Run every projection once. `since` (epoch ms) bounds the scan; the log bounds the sends. They're
 * complementary: `since` makes a run cheap, the log keeps it correct even when windows overlap.
 * Delivery is at-least-once (send, then log); the deterministic uuid is the dedup backstop for the
 * rare crash between the two.
 */
export async function runProjections({
  db, posthog, projections, since, now = Date.now(),
}: {
  db: PgAirtableDb;
  posthog: PosthogClient;
  projections: Projection[];
  since?: number;
  now?: number;
}): Promise<RunStats> {
  const stats: RunStats = { byEvent: {}, errors: [] };
  const statFor = (event: string): EventStats => {
    stats.byEvent[event] ??= {
      candidates: 0, skipped: 0, alreadySent: 0, sent: 0, failedBatches: 0,
    };
    return stats.byEvent[event];
  };

  for (const { event, calculateEvents } of projections) {
    const s = statFor(event);
    const candidates = await calculateEvents(db, { since });
    s.candidates += candidates.length;

    const valid = candidates.filter((c) => {
      const ok = c.distinctId != null && c.distinctId !== '' && Number.isFinite(c.timestampMs);
      if (!ok) s.skipped += 1;
      return ok;
    });

    const sentKeys = await getSentKeys(db, event, valid.map((c) => c.key));
    const todo = valid.filter((c) => {
      const seen = sentKeys.has(c.key);
      if (seen) s.alreadySent += 1;
      return !seen;
    });

    // historical_migration is per-request, so live (<=48h) and historical (>48h) can't share a batch.
    const partitions = [
      { group: todo.filter((c) => now - c.timestampMs <= FORTY_EIGHT_HOURS_MS), historicalMigration: false },
      { group: todo.filter((c) => now - c.timestampMs > FORTY_EIGHT_HOURS_MS), historicalMigration: true },
    ];

    for (const { group, historicalMigration } of partitions) {
      for (const batch of chunk(group, BATCH_SIZE)) {
        const prepared = batch.map((c) => ({
          candidate: c,
          event: {
            event,
            distinct_id: c.distinctId!,
            uuid: deterministicUuid(`${event}:${c.key}`),
            timestamp: new Date(c.timestampMs).toISOString(),
            properties: c.properties,
          } satisfies PosthogEvent,
        }));
        try {
          // Send THEN log — never the reverse. A crash between leaves the chunk unlogged, so the
          // next run re-sends it and the deterministic uuid lets PostHog dedup the duplicate.
          await posthog.sendBatch(prepared.map((p) => p.event), { historicalMigration });
          await db.pg.insert(posthogEmittedEventsTable).values(prepared.map((p) => ({
            id: `${event}:${p.candidate.key}`,
            event,
            internalUniqueKey: p.candidate.key,
            externalUuid: p.event.uuid,
            eventTimestamp: new Date(p.candidate.timestampMs).toISOString(),
            distinctId: p.candidate.distinctId,
          }))).onConflictDoNothing();
          s.sent += prepared.length;
        } catch (err) {
          s.failedBatches += 1;
          stats.errors.push(err);
        }
      }
    }
  }

  return stats;
}
