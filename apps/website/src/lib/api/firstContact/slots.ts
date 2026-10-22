// Picks which teammates a new hire meets and when. Pure functions, so they're easy to test.

import { createHash } from 'crypto';

export type Interval = { start: Date; end: Date };

export type Teammate = {
  slackUserId: string;
  name: string;
  email: string;
  timeZone: string;
  busy: Interval[];
};

export type PlannedChat = { teammate: Teammate; slot: Interval };

export const CHATS_PER_HIRE = 5;
export const CHAT_MINUTES = 30;
const NOTICE_HOURS = 12;
export const SEARCH_DAYS = 14;

type Hours = { start: number; end: number };

// Local hours in minutes after midnight, tried in order: the core of the day for both people first, then a wider
// day, which is what lets SF and Europe meet. Weekdays only, in both people's time zones.
const WINDOWS: { teammate: Hours; hire: Hours }[] = [
  { teammate: { start: 10 * 60, end: 16 * 60 }, hire: { start: 9 * 60, end: 18 * 60 } },
  { teammate: { start: 8 * 60, end: 18 * 60 }, hire: { start: 8 * 60, end: 20 * 60 } },
];

const STEP_MS = 30 * 60 * 1000;
const CHAT_MS = CHAT_MINUTES * 60 * 1000;
const WEEKDAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

export function searchWindow({ nowMs }: { nowMs: number }): Interval {
  return { start: new Date(nowMs + NOTICE_HOURS * 60 * 60 * 1000), end: new Date(nowMs + SEARCH_DAYS * 24 * 60 * 60 * 1000) };
}

/**
 * Teammates who have had the fewest First Contact chats lately come first, so the welcomes are shared around.
 * Ties are broken by a hash of the seed, so the same hire gets the same order if the page is submitted twice.
 */
export function orderTeammates<T extends { email: string }>({ teammates, pastChats, seed }: {
  teammates: T[];
  pastChats: Map<string, number>;
  seed: string;
}): T[] {
  return [...teammates]
    .map((teammate) => ({ teammate, count: pastChats.get(teammate.email.toLowerCase()) ?? 0, tiebreak: hash(`${seed}|${teammate.email.toLowerCase()}`) }))
    .sort((a, b) => a.count - b.count || a.tiebreak.localeCompare(b.tiebreak))
    .map(({ teammate }) => teammate);
}

/**
 * Gives each teammate, in order, a slot on a different weekday from the hire's other chats, until `count` are booked.
 * Each chat takes the earliest day that works, at a seeded random time on that day, so welcomes come soon but
 * aren't all at 10am. Teammates with no shared free time are skipped.
 */
export function planChats({
  hire, teammates, window, seed, count = CHATS_PER_HIRE,
}: {
  hire: { timeZone: string; busy: Interval[] };
  teammates: Teammate[];
  window: Interval;
  seed: string;
  count?: number;
}): PlannedChat[] {
  const chats: PlannedChat[] = [];
  const usedDays = new Set<string>();
  const hireSlots = candidateSlots({ window })
    .filter((slot) => isFree(slot, hire.busy))
    .map((slot) => ({ slot, local: localParts(slot.start, hire.timeZone) }));

  for (const teammate of teammates) {
    if (chats.length >= count) break;

    for (const hours of WINDOWS) {
      const candidates = hireSlots.filter(({ slot, local }) => !usedDays.has(local.day)
        && fitsHours(local, hours.hire)
        && fitsHours(localParts(slot.start, teammate.timeZone), hours.teammate)
        && isFree(slot, teammate.busy));
      if (candidates.length === 0) continue;

      const firstDay = candidates[0]!.local.day;
      const sameDay = candidates.filter(({ local }) => local.day === firstDay);
      const { slot } = sameDay[parseInt(hash(`${seed}|${teammate.email}`).slice(0, 8), 16) % sameDay.length]!;
      chats.push({ teammate, slot });
      usedDays.add(firstDay);
      break;
    }
  }

  return chats;
}

/** Every :00 and :30 start inside the window. */
function candidateSlots({ window }: { window: Interval }): Interval[] {
  const slots: Interval[] = [];
  for (let startMs = Math.ceil(window.start.getTime() / STEP_MS) * STEP_MS; startMs + CHAT_MS <= window.end.getTime(); startMs += STEP_MS) {
    slots.push({ start: new Date(startMs), end: new Date(startMs + CHAT_MS) });
  }

  return slots;
}

function fitsHours(start: { weekday: string; minutes: number }, hours: Hours): boolean {
  return WEEKDAYS.has(start.weekday) && start.minutes >= hours.start && start.minutes + CHAT_MINUTES <= hours.end;
}

function isFree(slot: Interval, busy: Interval[]): boolean {
  return busy.every((interval) => interval.end <= slot.start || interval.start >= slot.end);
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function localParts(date: Date, timeZone: string): { weekday: string; minutes: number; day: string } {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    formatters.set(timeZone, formatter);
  }

  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    weekday: parts.weekday!,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    day: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function hash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}
