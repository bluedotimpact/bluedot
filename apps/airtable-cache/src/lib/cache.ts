import z from 'zod';
import { sql } from 'kysely';
import { db } from '../db/client';
import { Key } from '../db/generated/public/CachedResponse';

export interface CacheValue {
  body: string,
  headers: Record<string, string>,
  status: number
}

// We're taking a 'stale-while-revalidate' approach.

// How long a cached response is considered fresh.
// If a request comes in after this, we can serve a valid cached response, but a new request should be made to update the cache.
const CACHE_FRESH_DURATION_MS = 3 * 60 * 1000;

// How long a cached response is considered valid.
// If a request comes in after this, we won't return it from the cache.
const CACHE_VALID_DURATION_MS = 5 * 60 * 1000;

export const getValue = async (key: string): Promise<{ status: 'hit' | 'stale', value: CacheValue } | { status: 'miss' }> => {
  const res = await db.selectFrom('cached_response')
    .select(['body', 'headers', 'status', 'inserted_at'])
    .where('key', '=', key as Key)
    .where('inserted_at', '>=', new Date(Date.now() - CACHE_VALID_DURATION_MS))
    .executeTakeFirst();

  if (!res) {
    return { status: 'miss' };
  }

  return {
    status: res.inserted_at > new Date(Date.now() - CACHE_FRESH_DURATION_MS) ? 'hit' : 'stale',
    value: {
      body: res.body,
      headers: z.record(z.string()).parse(res.headers),
      status: res.status,
    },
  };
};

export const setValue = async (key: string, value: CacheValue): Promise<void> => {
  await db.insertInto('cached_response')
    .values({
      key: key as Key,
      body: value.body,
      headers: value.headers,
      status: value.status,
    })
    .onConflict((ocb) => ocb.column('key').doUpdateSet({
      body: value.body, headers: value.headers, status: value.status, inserted_at: new Date(),
    }))
    .execute();
};

export const clearValues = async (keyPrefix: string): Promise<void> => {
  await db.deleteFrom('cached_response')
    .where('key', 'like', sql`${keyPrefix}%`)
    .execute();
};

export const clearValuesContainingBody = async (keyPrefix: string, body: string): Promise<void> => {
  await db.deleteFrom('cached_response')
    .where('key', 'like', `${keyPrefix}%` as Key)
    .where('body', 'like', `%${body}%`)
    .execute();
};

export const clearExpiredValues = async (): Promise<void> => {
  await db.deleteFrom('cached_response')
    .where('inserted_at', '<', new Date(Date.now() - CACHE_VALID_DURATION_MS))
    .execute();
};
