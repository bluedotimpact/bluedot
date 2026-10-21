import {
  and, calendarPairWithoutCalendarTable, eq, inArray, isNull, ne, sql, userTable, type CalendarPairWithoutCalendar,
} from '@bluedot/db';
import type { BusyMember, BusyUser } from './calendarConnections';
import { listConnectionsForUser } from './calendarConnections';
import db from './db';

// Lets people who can't connect a calendar (e.g. Proton or Apple users) still be paired by Dot-to-Dot.
// Dot-to-Dot treats them as free during the working day in their Slack time zone.

export async function getPairWithoutCalendar(userId: string): Promise<CalendarPairWithoutCalendar | null> {
  const [row] = await db.pg
    .select()
    .from(calendarPairWithoutCalendarTable.pg)
    .where(eq(calendarPairWithoutCalendarTable.pg.userId, userId));
  return row ?? null;
}

/**
 * Turns it on for this user. Same Slack linking rule as calendar connections: a signed link claims that Slack member
 * (taking it off anyone else's opt-in), otherwise we keep any existing link or reuse the one on their calendars.
 */
export async function setPairWithoutCalendar({ userId, linkedSlackUserId }: { userId: string; linkedSlackUserId: string | null }): Promise<void> {
  const existing = await getPairWithoutCalendar(userId);
  const slackUserId = linkedSlackUserId
    ?? existing?.slackUserId
    ?? (await listConnectionsForUser(userId)).filter((c) => c.slackUserId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.slackUserId
    ?? null;
  const values = { slackUserId, updatedAt: new Date().toISOString() };

  await db.pg.transaction(async (tx) => {
    if (linkedSlackUserId) {
      await tx.update(calendarPairWithoutCalendarTable.pg)
        .set({ slackUserId: null })
        .where(and(eq(calendarPairWithoutCalendarTable.pg.slackUserId, linkedSlackUserId), ne(calendarPairWithoutCalendarTable.pg.userId, userId)));
    }

    await tx.insert(calendarPairWithoutCalendarTable.pg)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: calendarPairWithoutCalendarTable.pg.userId, set: values });
  });
}

export async function clearPairWithoutCalendar(userId: string): Promise<number> {
  const deleted = await db.pg
    .delete(calendarPairWithoutCalendarTable.pg)
    .where(eq(calendarPairWithoutCalendarTable.pg.userId, userId))
    .returning({ id: calendarPairWithoutCalendarTable.pg.id });
  return deleted.length;
}

const normaliseEmail = (email: string) => email.trim().toLowerCase();

export type BusyUserWithPairing = BusyUser & { pairWithoutCalendar: boolean };

/**
 * Adds `pairWithoutCalendar` to each member's busy result. A member matches an opt-in linked to their Slack ID, else
 * the opt-in of the BlueDot user with the same email that isn't linked to any Slack member (as for calendars).
 * Their account email is added to `emails` (and `email`, if empty) so Dot-to-Dot can invite them.
 */
export async function addPairWithoutCalendar({ members, users }: { members: BusyMember[]; users: Record<string, BusyUser> }): Promise<Record<string, BusyUserWithPairing>> {
  const slackIds = members.map((m) => m.slackUserId);
  const linked = slackIds.length === 0 ? [] : await db.pg
    .select({ userId: calendarPairWithoutCalendarTable.pg.userId, slackUserId: calendarPairWithoutCalendarTable.pg.slackUserId })
    .from(calendarPairWithoutCalendarTable.pg)
    .where(inArray(calendarPairWithoutCalendarTable.pg.slackUserId, slackIds));
  const userIdBySlackId = new Map(linked.map((row) => [row.slackUserId!, row.userId]));

  const emailsToMatch = [...new Set(members
    .filter((m) => !userIdBySlackId.has(m.slackUserId) && m.email?.trim())
    .map((m) => normaliseEmail(m.email!)))];
  const unlinked = emailsToMatch.length === 0 ? [] : await db.pg
    .select({ userId: calendarPairWithoutCalendarTable.pg.userId, email: userTable.pg.email })
    .from(calendarPairWithoutCalendarTable.pg)
    .innerJoin(userTable.pg, eq(userTable.pg.id, calendarPairWithoutCalendarTable.pg.userId))
    .where(and(
      isNull(calendarPairWithoutCalendarTable.pg.slackUserId),
      inArray(sql<string>`lower(trim(${userTable.pg.email}))`, emailsToMatch),
    ));
  const userIdByEmail = new Map(unlinked.map((row) => [normaliseEmail(row.email), row.userId]));

  const ownerIds = [...new Set(linked.map((row) => row.userId))];
  const owners = ownerIds.length === 0 ? [] : await db.pg
    .select({ id: userTable.pg.id, email: userTable.pg.email })
    .from(userTable.pg)
    .where(inArray(userTable.pg.id, ownerIds));
  const emailByUserId = new Map([...owners.map((u) => [u.id, u.email] as const), ...unlinked.map((u) => [u.userId, u.email] as const)]);

  const out: Record<string, BusyUserWithPairing> = {};
  for (const member of members) {
    const user = users[member.slackUserId]!;
    const optInUserId = userIdBySlackId.get(member.slackUserId)
      ?? (member.email ? userIdByEmail.get(normaliseEmail(member.email)) : undefined);
    const trimmedEmail = optInUserId ? emailByUserId.get(optInUserId)?.trim() : undefined;
    const accountEmail = trimmedEmail === '' ? undefined : trimmedEmail;

    out[member.slackUserId] = {
      ...user,
      email: user.email ?? accountEmail ?? null,
      emails: accountEmail ? [...new Set([...user.emails, normaliseEmail(accountEmail)])] : user.emails,
      pairWithoutCalendar: optInUserId !== undefined,
    };
  }

  return out;
}
