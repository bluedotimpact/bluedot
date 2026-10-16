import {
  and, calendarConnectionTable, eq, inArray, userTable, type CalendarConnection,
} from '@bluedot/db';
import { logger } from '@bluedot/ui/src/api';
import { decryptRefreshToken, encryptRefreshToken } from './calendarConnect';
import db from './db';
import {
  GoogleCalendarAccessError, GoogleInvalidGrantError, getGooglePrimaryBusy, refreshGoogleAccessToken, revokeGoogleToken,
  type BusyInterval, type GoogleTokenExchange,
} from './googleCalendar';

const BUSY_CONCURRENCY = 5;

export async function upsertGoogleConnection({
  userId, slackUserId, timeZone, exchange,
}: { userId: string; slackUserId: string; timeZone: string | null; exchange: GoogleTokenExchange }): Promise<void> {
  const now = new Date().toISOString();
  const values = {
    slackUserId,
    providerAccountEmail: exchange.email,
    encryptedRefreshToken: encryptRefreshToken(exchange.refreshToken),
    scopes: exchange.scopes.join(' '),
    timeZone,
    lastError: null,
    lastErrorAt: null,
    updatedAt: now,
  };

  await db.pg
    .insert(calendarConnectionTable.pg)
    .values({
      userId, provider: 'google', providerAccountId: exchange.accountId, ...values,
    })
    .onConflictDoUpdate({
      target: [calendarConnectionTable.pg.userId, calendarConnectionTable.pg.provider, calendarConnectionTable.pg.providerAccountId],
      set: values,
    });
}

export async function listConnectionsForUser(userId: string): Promise<CalendarConnection[]> {
  return db.pg
    .select()
    .from(calendarConnectionTable.pg)
    .where(eq(calendarConnectionTable.pg.userId, userId))
    .orderBy(calendarConnectionTable.pg.createdAt);
}

/** The Slack member this account last connected a calendar for, so "Add another calendar" needs no new link. */
export async function getSlackUserIdForUser(userId: string): Promise<string | null> {
  const connections = await listConnectionsForUser(userId);
  const latest = connections.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return latest?.slackUserId ?? null;
}

/**
 * Deletes the given connections, and revokes each Google grant unless another row still uses it.
 * Google grants are per Google account, so revoking one would break the same account connected for another Slack member.
 */
export async function deleteConnections(connections: CalendarConnection[]): Promise<number> {
  if (connections.length === 0) return 0;

  await db.pg.delete(calendarConnectionTable.pg).where(inArray(calendarConnectionTable.pg.id, connections.map((c) => c.id)));

  await Promise.all(connections.map(async (connection) => {
    const [stillUsed] = await db.pg
      .select({ id: calendarConnectionTable.pg.id })
      .from(calendarConnectionTable.pg)
      .where(and(
        eq(calendarConnectionTable.pg.provider, connection.provider),
        eq(calendarConnectionTable.pg.providerAccountId, connection.providerAccountId),
      ))
      .limit(1);
    if (stillUsed) return;

    try {
      const revoked = await revokeGoogleToken(decryptRefreshToken(connection.encryptedRefreshToken));
      if (!revoked) logger.warn(`[CalendarConnect] Google did not accept the revoke for connection ${connection.id}`);
    } catch (error) {
      logger.warn(`[CalendarConnect] Could not revoke connection ${connection.id}`, error);
    }
  }));

  return connections.length;
}

export async function disconnectConnection({ userId, connectionId }: { userId: string; connectionId: string }): Promise<boolean> {
  const connections = await db.pg
    .select()
    .from(calendarConnectionTable.pg)
    .where(and(eq(calendarConnectionTable.pg.id, connectionId), eq(calendarConnectionTable.pg.userId, userId)));
  return (await deleteConnections(connections)) > 0;
}

export type BusyUser = {
  connected: boolean;
  timeZone: string | null;
  email: string | null;
  busy: BusyInterval[];
  errors: string[];
};

/** Busy times per Slack member, merged across every calendar they connected. Shape matches dot-to-dot src/bluedot.ts. */
export async function getBusyTimes({ slackUserIds, timeMin, timeMax }: { slackUserIds: string[]; timeMin: string; timeMax: string }): Promise<Record<string, BusyUser>> {
  const uniqueIds = [...new Set(slackUserIds)];
  const connections = uniqueIds.length === 0 ? [] : await db.pg
    .select()
    .from(calendarConnectionTable.pg)
    .where(inArray(calendarConnectionTable.pg.slackUserId, uniqueIds));

  const userIds = [...new Set(connections.map((c) => c.userId))];
  const users = userIds.length === 0 ? [] : await db.pg
    .select({ id: userTable.pg.id, email: userTable.pg.email })
    .from(userTable.pg)
    .where(inArray(userTable.pg.id, userIds));
  const emailByUserId = new Map(users.map((u) => [u.id, u.email]));

  const results = await mapWithConcurrency(connections, BUSY_CONCURRENCY, (connection) => fetchConnectionBusy({ connection, timeMin, timeMax }));

  const out: Record<string, BusyUser> = {};
  for (const slackUserId of uniqueIds) {
    const mine = connections
      .map((connection, i) => ({ connection, result: results[i]! }))
      .filter(({ connection }) => connection.slackUserId === slackUserId)
      .sort((a, b) => b.connection.updatedAt.localeCompare(a.connection.updatedAt));
    const working = mine.filter(({ result }) => result.ok);
    const latestUserId = mine[0]?.connection.userId;

    out[slackUserId] = {
      connected: working.length > 0,
      timeZone: mine.find(({ connection }) => connection.timeZone)?.connection.timeZone ?? null,
      email: latestUserId ? emailByUserId.get(latestUserId) ?? null : null,
      busy: mergeIntervals(working.flatMap(({ result }) => (result.ok ? result.busy : []))),
      errors: mine.flatMap(({ result }) => (result.ok ? [] : [result.error])),
    };
  }

  return out;
}

type ConnectionBusyResult = { ok: true; busy: BusyInterval[] } | { ok: false; error: string };

async function fetchConnectionBusy({ connection, timeMin, timeMax }: { connection: CalendarConnection; timeMin: string; timeMax: string }): Promise<ConnectionBusyResult> {
  const label = `${connection.providerAccountEmail} (${connection.provider})`;
  try {
    const accessToken = await refreshGoogleAccessToken(decryptRefreshToken(connection.encryptedRefreshToken));
    const busy = await getGooglePrimaryBusy({ accessToken, timeMin, timeMax });
    if (connection.lastError) {
      await db.pg.update(calendarConnectionTable.pg)
        .set({ lastError: null, lastErrorAt: null })
        .where(eq(calendarConnectionTable.pg.id, connection.id));
    }

    return { ok: true, busy };
  } catch (error) {
    if (error instanceof GoogleInvalidGrantError || error instanceof GoogleCalendarAccessError) {
      // Needs the member to reconnect, so record it where /account can show it. updatedAt stays "when they last connected".
      await db.pg.update(calendarConnectionTable.pg)
        .set({ lastError: error instanceof GoogleInvalidGrantError ? 'invalid_grant' : error.message, lastErrorAt: new Date().toISOString() })
        .where(eq(calendarConnectionTable.pg.id, connection.id));
      return { ok: false, error: `${label}: ${error.message}. They need to reconnect it on their BlueDot account page.` };
    }

    logger.warn(`[CalendarConnect] Busy lookup failed for connection ${connection.id}`, error);
    return { ok: false, error: `${label}: lookup failed (${error instanceof Error ? error.message : String(error)})` };
  }
}

/** Sorts and merges overlapping or touching intervals. */
export function mergeIntervals(intervals: BusyInterval[]): BusyInterval[] {
  const sorted = intervals
    .map((i) => ({ startMs: Date.parse(i.start), endMs: Date.parse(i.end) }))
    .filter((i) => !Number.isNaN(i.startMs) && !Number.isNaN(i.endMs) && i.endMs > i.startMs)
    .sort((a, b) => a.startMs - b.startMs);

  const merged: { startMs: number; endMs: number }[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (last && interval.startMs <= last.endMs) {
      last.endMs = Math.max(last.endMs, interval.endMs);
    } else {
      merged.push({ ...interval });
    }
  }

  return merged.map((i) => ({ start: new Date(i.startMs).toISOString(), end: new Date(i.endMs).toISOString() }));
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      // eslint-disable-next-line no-await-in-loop
      results[index] = await fn(items[index]!);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
