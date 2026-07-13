import {
  and,
  chunkTable,
  eq,
  inArray,
  type Unit,
  type PgAirtableDb,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { timingSafeEqual } from 'crypto';
import env from './env';

/**
 * Verify the shared secret sent by external callers of public procedures (currently
 * Airtable automation scripts). Use this at the top of any public procedure that
 * should only be callable by our own automations, before touching the database.
 *
 * Throws UNAUTHORIZED if the token doesn't match, or INTERNAL_SERVER_ERROR if the
 * secret isn't configured in the environment. Comparison is constant-time.
 */
export function verifyPublicToken(publicToken: string) {
  if (!env.CERTIFICATE_CREATION_TOKEN) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Public token not configured' });
  }

  const tokenBuf = Buffer.from(publicToken);
  const secretBuf = Buffer.from(env.CERTIFICATE_CREATION_TOKEN);
  if (tokenBuf.length !== secretBuf.length || !timingSafeEqual(tokenBuf, secretBuf)) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid token' });
  }
}

/**
 * Filter the `chunks` field on each element of `units` to only include the ids of active
 * chunks. This makes it so this array of ids matches the full chunks objects which may be
 * sent to the client.
 *
 * Returns a new (shallow copied) array of units, with only the `chunks` field modified.
 */
export async function removeInactiveChunkIdsFromUnits({
  units,
  db,
}: {
  units: Unit[];
  db: PgAirtableDb;
}): Promise<Unit[]> {
  const allChunkIds = units.map((unit) => unit.chunks ?? []).flat();
  const allActiveChunkIds = new Set((
    await db.pg
      .select({ id: chunkTable.pg.id })
      .from(chunkTable.pg)
      .where(and(
        eq(chunkTable.pg.status, 'Active'),
        inArray(chunkTable.pg.id, allChunkIds),
      ))
  ).map((chunk) => chunk.id));
  return units.map((unit) => ({
    ...unit,
    chunks: unit.chunks?.filter((c) => allActiveChunkIds.has(c)) ?? [],
  }));
}
