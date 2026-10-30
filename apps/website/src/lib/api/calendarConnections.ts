import {
  and, calendarConnectionTable, eq, inArray, isNull, ne, sql, userTable, type CalendarConnection, type CalendarProvider,
} from '@bluedot/db';
import { logger } from '@bluedot/ui/src/api';
import { decryptRefreshToken, encryptRefreshToken } from './calendarConnect';
import db from './db';
import {
  GoogleCalendarAccessError, GoogleInvalidGrantError, getGooglePrimaryBusy, refreshGoogleAccessToken, revokeGoogleToken,
  type BusyInterval,
} from './googleCalendar';
import {
  MicrosoftCalendarAccessError, MicrosoftInvalidGrantError, getMicrosoftDefaultBusy, refreshMicrosoftAccessToken,
} from './microsoftCalendar';

const BUSY_CONCURRENCY = 5;

/** What a provider's sign-in gives us, whichever provider it is */
export type ProviderTokenExchange = {
  refreshToken: string;
  scopes: string[];
  accountId: string;
  email: string;
};

/**
 * Saves a Google or Microsoft connection for this BlueDot user.
 * With a Slack member from a signed link, that member is claimed for all of this user's calendars, and taken off any other
 * user's calendars (the newest link wins). Without one, the new calendar inherits whatever Slack member the user's
 * other calendars have, or none, in which case Dot-to-Dot matches the user by account email.
 */
export async function saveConnection({
  provider, userId, linkedSlackUserId, timeZone, exchange,
}: { provider: CalendarProvider; userId: string; linkedSlackUserId: string | null; timeZone: string | null; exchange: ProviderTokenExchange }): Promise<void> {
  const slackUserId = linkedSlackUserId ?? await getSlackUserIdForUser(userId);
  const values = {
    slackUserId,
    providerAccountEmail: exchange.email,
    encryptedRefreshToken: encryptRefreshToken(exchange.refreshToken),
    scopes: exchange.scopes.join(' '),
    timeZone,
    lastError: null,
    lastErrorAt: null,
    updatedAt: new Date().toISOString(),
  };

  // One transaction, so a failed save never leaves the Slack member taken off someone else without landing here
  await db.pg.transaction(async (tx) => {
    if (linkedSlackUserId) {
      await tx.update(calendarConnectionTable.pg)
        .set({ slackUserId: null })
        .where(and(eq(calendarConnectionTable.pg.slackUserId, linkedSlackUserId), ne(calendarConnectionTable.pg.userId, userId)));
      await tx.update(calendarConnectionTable.pg)
        .set({ slackUserId: linkedSlackUserId })
        .where(eq(calendarConnectionTable.pg.userId, userId));
    }

    await tx
      .insert(calendarConnectionTable.pg)
      .values({
        userId, provider, providerAccountId: exchange.accountId, ...values,
      })
      .onConflictDoUpdate({
        target: [calendarConnectionTable.pg.userId, calendarConnectionTable.pg.provider, calendarConnectionTable.pg.providerAccountId],
        set: values,
      });
  });
}

export async function listConnectionsForUser(userId: string): Promise<CalendarConnection[]> {
  return db.pg
    .select()
    .from(calendarConnectionTable.pg)
    .where(eq(calendarConnectionTable.pg.userId, userId))
    .orderBy(calendarConnectionTable.pg.createdAt);
}

/** The Slack member this user's calendars are linked to, if any. */
async function getSlackUserIdForUser(userId: string): Promise<string | null> {
  const connections = await listConnectionsForUser(userId);
  const latest = connections
    .filter((c) => c.slackUserId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return latest?.slackUserId ?? null;
}

/**
 * Deletes the given connections, and revokes each Google grant unless another row still uses it.
 * Google grants are per Google account, so revoking one would break the same account connected by another BlueDot user.
 * Microsoft has no per-app revoke (only "sign out everywhere"), so for Outlook we only delete the stored token. The page
 * tells people they can also remove BlueDot's access in their Microsoft account.
 */
export async function deleteConnections(connections: CalendarConnection[]): Promise<number> {
  if (connections.length === 0) return 0;

  await db.pg.delete(calendarConnectionTable.pg).where(inArray(calendarConnectionTable.pg.id, connections.map((c) => c.id)));

  await Promise.all(connections.map(async (connection) => {
    if (connection.provider !== 'google') return;
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

export type BusyMember = { slackUserId: string; email: string | null };

export type BusyUser = {
  connected: boolean;
  timeZone: string | null;
  email: string | null;
  // Every address we know for them: their BlueDot account email(s) and each connected Google or Microsoft account. Dot-to-Dot
  // invites all of them, so the chat shows up in whichever calendar they actually use.
  emails: string[];
  busy: BusyInterval[];
  errors: string[];
  matchedBy: 'slack' | 'email' | null;
};

const normaliseEmail = (email: string) => email.trim().toLowerCase();

/**
 * Busy times per Slack member, merged across every calendar they connected. Shape matches dot-to-dot src/bluedot.ts.
 * A member matches the calendars linked to their Slack ID. Failing that, they match the calendars of the BlueDot user
 * with the same email, but only calendars not linked to any Slack member, so an explicit link always wins.
 */
export async function getBusyTimes({ members, timeMin, timeMax }: { members: BusyMember[]; timeMin: string; timeMax: string }): Promise<Record<string, BusyUser>> {
  const byId = new Map<string, BusyMember>();
  for (const member of members) {
    byId.set(member.slackUserId, member);
  }

  const slackIds = [...byId.keys()];
  const linked = slackIds.length === 0 ? [] : await db.pg
    .select()
    .from(calendarConnectionTable.pg)
    .where(inArray(calendarConnectionTable.pg.slackUserId, slackIds));
  const linkedIds = new Set(linked.map((c) => c.slackUserId));

  const emailsToMatch = [...new Set([...byId.values()]
    .filter((m) => !linkedIds.has(m.slackUserId) && m.email?.trim())
    .map((m) => normaliseEmail(m.email!)))];
  const emailUsers = emailsToMatch.length === 0 ? [] : await db.pg
    .select({ id: userTable.pg.id, email: userTable.pg.email })
    .from(userTable.pg)
    .where(inArray(sql<string>`lower(trim(${userTable.pg.email}))`, emailsToMatch));
  const unlinked = emailUsers.length === 0 ? [] : await db.pg
    .select()
    .from(calendarConnectionTable.pg)
    .where(and(inArray(calendarConnectionTable.pg.userId, emailUsers.map((u) => u.id)), isNull(calendarConnectionTable.pg.slackUserId)));

  const userIdsByEmail = new Map<string, string[]>();
  for (const user of emailUsers) {
    const key = normaliseEmail(user.email);
    userIdsByEmail.set(key, [...(userIdsByEmail.get(key) ?? []), user.id]);
  }

  const matches = new Map<string, { connections: CalendarConnection[]; matchedBy: 'slack' | 'email' | null }>();
  for (const member of byId.values()) {
    const bySlack = linked.filter((c) => c.slackUserId === member.slackUserId);
    if (bySlack.length > 0) {
      matches.set(member.slackUserId, { connections: bySlack, matchedBy: 'slack' });
      continue;
    }

    const userIds = member.email ? userIdsByEmail.get(normaliseEmail(member.email)) ?? [] : [];
    const byEmail = unlinked.filter((c) => userIds.includes(c.userId));
    matches.set(member.slackUserId, { connections: byEmail, matchedBy: byEmail.length > 0 ? 'email' : null });
  }

  const connections = [...new Map([...matches.values()].flatMap((m) => m.connections).map((c) => [c.id, c])).values()];
  const ownerIds = [...new Set(connections.map((c) => c.userId))];
  const owners = ownerIds.length === 0 ? [] : await db.pg
    .select({ id: userTable.pg.id, email: userTable.pg.email })
    .from(userTable.pg)
    .where(inArray(userTable.pg.id, ownerIds));
  const emailByUserId = new Map(owners.map((u) => [u.id, u.email]));

  const results = await mapWithConcurrency(connections, BUSY_CONCURRENCY, (connection) => fetchConnectionBusy({ connection, timeMin, timeMax }));
  const resultById = new Map(connections.map((c, i) => [c.id, results[i]!]));

  const out: Record<string, BusyUser> = {};
  for (const [slackUserId, { connections: mine, matchedBy }] of matches) {
    const withResults = mine
      .map((connection) => ({ connection, result: resultById.get(connection.id)! }))
      .sort((a, b) => b.connection.updatedAt.localeCompare(a.connection.updatedAt));
    const working = withResults.filter(({ result }) => result.ok);
    const latestUserId = withResults[0]?.connection.userId;

    out[slackUserId] = {
      connected: working.length > 0,
      timeZone: withResults.find(({ connection }) => connection.timeZone)?.connection.timeZone ?? null,
      email: latestUserId ? emailByUserId.get(latestUserId) ?? null : null,
      emails: [...new Set(withResults
        .flatMap(({ connection }) => [emailByUserId.get(connection.userId), connection.providerAccountEmail])
        .filter((email): email is string => Boolean(email?.trim()))
        .map(normaliseEmail))],
      busy: mergeIntervals(working.flatMap(({ result }) => (result.ok ? result.busy : []))),
      errors: withResults.flatMap(({ result }) => (result.ok ? [] : [result.error])),
      matchedBy,
    };
  }

  return out;
}

type ConnectionBusyResult = { ok: true; busy: BusyInterval[] } | { ok: false; error: string };

async function fetchConnectionBusy({ connection, timeMin, timeMax }: { connection: CalendarConnection; timeMin: string; timeMax: string }): Promise<ConnectionBusyResult> {
  const label = `${connection.providerAccountEmail} (${connection.provider})`;
  try {
    const busy = connection.provider === 'microsoft'
      ? await fetchMicrosoftBusy({ connection, timeMin, timeMax })
      : await getGooglePrimaryBusy({ accessToken: await refreshGoogleAccessToken(decryptRefreshToken(connection.encryptedRefreshToken)), timeMin, timeMax });
    if (connection.lastError) {
      await db.pg.update(calendarConnectionTable.pg)
        .set({ lastError: null, lastErrorAt: null })
        .where(eq(calendarConnectionTable.pg.id, connection.id));
    }

    return { ok: true, busy };
  } catch (error) {
    const invalidGrant = error instanceof GoogleInvalidGrantError || error instanceof MicrosoftInvalidGrantError;
    if (invalidGrant || error instanceof GoogleCalendarAccessError || error instanceof MicrosoftCalendarAccessError) {
      // Needs the member to reconnect, so record it where /account can show it. updatedAt stays "when they last connected".
      await db.pg.update(calendarConnectionTable.pg)
        .set({ lastError: invalidGrant ? 'invalid_grant' : error.message, lastErrorAt: new Date().toISOString() })
        .where(eq(calendarConnectionTable.pg.id, connection.id));
      return { ok: false, error: `${label}: ${error.message}. They need to reconnect it at bluedot.org/account/calendars.` };
    }

    logger.warn(`[CalendarConnect] Busy lookup failed for connection ${connection.id}`, error);
    return { ok: false, error: `${label}: lookup failed (${error instanceof Error ? error.message : String(error)})` };
  }
}

/** Microsoft rotates refresh tokens, so store the new one before reading the calendar. */
async function fetchMicrosoftBusy({ connection, timeMin, timeMax }: { connection: CalendarConnection; timeMin: string; timeMax: string }): Promise<BusyInterval[]> {
  const { accessToken, refreshToken } = await refreshMicrosoftAccessToken(decryptRefreshToken(connection.encryptedRefreshToken));
  if (refreshToken) {
    // updatedAt stays "when they last connected", which the busy endpoint uses to pick the newest calendar
    await db.pg.update(calendarConnectionTable.pg)
      .set({ encryptedRefreshToken: encryptRefreshToken(refreshToken) })
      .where(eq(calendarConnectionTable.pg.id, connection.id));
  }

  return getMicrosoftDefaultBusy({ accessToken, timeMin, timeMax });
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
