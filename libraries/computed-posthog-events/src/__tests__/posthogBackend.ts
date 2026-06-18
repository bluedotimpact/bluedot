import { vi } from 'vitest';
import type { PostHogEvent } from '../core';

/**
 * In-memory model of PostHog ingestion, matching the (partly undocumented) semantics we
 * verified against staging:
 *  - a track event creates/uses a person for its `distinct_id`;
 *  - a `$identify` event carrying `$anon_distinct_id` MERGES the anonymous person into the identified
 *    person — both distinct ids then resolve to one person;
 *  - the `$set` person properties on that identify are applied to the merged person.
 *
 * Both the merge and the `$set` happen whether or not the batch is sent with `historical_migration`.
 * The engine sends `$identify` live regardless, so this only matters for keeping the model faithful.
 *
 * These semantics were validated against real PostHog ingestion model-based test, which is preserved
 * on the `wh-2663-posthog-events-2026-06-archive` git branch, file
 * `libraries/computed-posthog-events/src/__tests__/posthogBackend.staging.test.ts`.
 *
 * Install in a test and call `vi.unstubAllGlobals()` in `afterEach` to remove the fetch stub.
 */
export type PosthogBackend = {
  /** Every event received, in order. */
  events: PostHogEvent[];
  /** Each /batch request received, with its historical_migration flag. */
  receivedBatches: { historicalMigration: boolean; events: PostHogEvent[] }[];
  /** Fault injection: make the next `n` /batch sends fail with a 500 (nothing recorded), to exercise retry paths. */
  failNextSends: (n: number) => void;
  /** Resolved person id for a distinct id (undefined if never seen). */
  personIdFor: (distinctId: string) => string | undefined;
  /** Person properties for a distinct id's person. */
  personPropsFor: (distinctId: string) => Record<string, unknown> | undefined;
  /** Whether two distinct ids resolve to the same person (i.e. have been merged). */
  isSamePerson: (a: string, b: string) => boolean;
};

type Person = { id: string; properties: Record<string, unknown> };

export function mockPostHogBackend(): PosthogBackend {
  const events: PostHogEvent[] = [];
  const receivedBatches: { historicalMigration: boolean; events: PostHogEvent[] }[] = [];
  const personIdByDistinctId = new Map<string, string>();
  const persons = new Map<string, Person>();
  let sequentialCounter = 0;
  let failNext = 0;

  const ensurePerson = (distinctId: string): string => {
    const existing = personIdByDistinctId.get(distinctId);

    if (existing) return existing;

    sequentialCounter += 1;
    const id = `person-${sequentialCounter}`;
    personIdByDistinctId.set(distinctId, id);
    persons.set(id, { id, properties: {} });

    return id;
  };

  const merge = (anonId: string, identifiedId: string, set: Record<string, unknown> | undefined) => {
    const targetId = ensurePerson(identifiedId);
    const anonPersonId = personIdByDistinctId.get(anonId);
    if (anonPersonId && anonPersonId !== targetId) {
      // repoint every distinct id of the anonymous person to the identified person, then drop it
      for (const [did, pid] of personIdByDistinctId) {
        if (pid === anonPersonId) personIdByDistinctId.set(did, targetId);
      }

      persons.delete(anonPersonId);
    } else {
      personIdByDistinctId.set(anonId, targetId);
    }

    if (set) Object.assign(persons.get(targetId)!.properties, set);
  };

  vi.stubGlobal('fetch', async (_url: string, init: { body: string }) => {
    if (failNext > 0) {
      failNext -= 1;
      return new Response('posthog down', { status: 500 });
    }

    const body = JSON.parse(init.body) as { historical_migration?: boolean; batch: PostHogEvent[] };
    const historical = body.historical_migration === true;
    for (const ev of body.batch) {
      const anon = ev.properties?.$anon_distinct_id;
      if (ev.event === '$identify' && typeof anon === 'string') {
        merge(anon, ev.distinct_id, ev.properties?.$set as Record<string, unknown> | undefined);
      } else {
        ensurePerson(ev.distinct_id);
      }

      events.push(ev);
    }

    receivedBatches.push({ historicalMigration: historical, events: body.batch });

    return new Response(JSON.stringify({ status: 'Ok' }), { status: 200 });
  });

  return {
    events,
    receivedBatches,
    failNextSends: (n) => {
      failNext = n;
    },
    personIdFor: (d) => personIdByDistinctId.get(d),
    personPropsFor: (d) => {
      const pid = personIdByDistinctId.get(d);
      return pid ? persons.get(pid)!.properties : undefined;
    },
    isSamePerson: (a, b) => {
      const pa = personIdByDistinctId.get(a);
      return pa !== undefined && pa === personIdByDistinctId.get(b);
    },
  };
}
