// First Contact: when a new hire connects their calendar on /welcome, book them five 30-minute chats with
// teammates from #welcome straight away, and tell #welcome who they're meeting.

import { logger } from '@bluedot/ui/src/api';
import createHttpError from 'http-errors';
import env from '../env';
import { refreshGoogleAccessToken } from '../googleCalendar';
import { type BookedChat, FirstContactCalendar } from './calendar';
import { FirstContactSlack } from './slack';
import {
  CHATS_PER_HIRE, type Interval, type PlannedChat, orderTeammates, planChats, searchWindow,
} from './slots';

// How far back to count past chats, both for sharing welcomes around and for spotting someone who comes back
const HISTORY_DAYS = 90;

export type FirstContactHire = {
  email: string;
  name: string;
  timeZone: string;
  busy: Interval[];
};

export type FirstContactResult = {
  // Every chat this hire has, including any booked on an earlier visit
  chats: BookedChat[];
  // How many of the five we couldn't find a time for
  missing: number;
};

export const FIRST_CONTACT_PROMPTS = (hireFirstName: string, teammateFirstName: string) => [
  'What\'s a story from your life that explains who you are today?',
  `${hireFirstName}: why did you say yes to BlueDot? ${teammateFirstName}: what keeps you here?`,
  'What\'s one thing about how you like to work?',
];

export async function bookFirstContactChats({ hire: rawHire, nowMs }: { hire: FirstContactHire; nowMs: number }): Promise<FirstContactResult> {
  const hire = { ...rawHire, name: cleanName(rawHire.name) };
  const config = getConfig();
  const calendar = new FirstContactCalendar(await refreshGoogleAccessToken(config.googleRefreshToken), config.calendarId);
  const slack = new FirstContactSlack(config.slackToken, config.channelId);
  const hireEmail = hire.email.toLowerCase();

  const history = await calendar.chatsSince({ since: new Date(nowMs - HISTORY_DAYS * 24 * 60 * 60 * 1000) });
  const existing = history.filter((chat) => chat.hire === hireEmail);
  const needed = CHATS_PER_HIRE - existing.length;
  if (needed <= 0) return { chats: existing, missing: 0 };

  const pastChats = new Map<string, number>();
  for (const chat of history) pastChats.set(chat.teammateEmail, (pastChats.get(chat.teammateEmail) ?? 0) + 1);

  const alreadyMeeting = new Set(existing.map((chat) => chat.teammateEmail));
  // New hires are often in Slack before they start, under a bluedot.org email that isn't the Google account they
  // signed in with, so match their name too
  const candidates = (await slack.teammates()).filter((t) => t.email !== hireEmail
    && !sameName(t.name, hire.name)
    && !alreadyMeeting.has(t.email));
  if (candidates.length === 0) throw new Error('First Contact found nobody to meet in the #welcome channel');

  const window = searchWindow({ nowMs });
  const busy = await calendar.busyTimes({ emails: candidates.map((t) => t.email), window });
  const teammates = orderTeammates({ teammates: candidates, pastChats, seed: hireEmail })
    .flatMap((t) => {
      const teammateBusy = busy.get(t.email);
      return teammateBusy ? [{ ...t, busy: teammateBusy }] : [];
    });

  const existingSlots = existing.map((chat) => {
    const start = new Date(chat.start);
    return { start, end: new Date(start.getTime() + 30 * 60 * 1000) };
  });
  const planned = planChats({
    hire: { timeZone: hire.timeZone, busy: [...hire.busy, ...existingSlots] },
    teammates,
    window,
    seed: hireEmail,
    count: needed,
  });

  const hireFirstName = firstName(hire.name);
  await Promise.all(planned.map(({ teammate, slot }) => calendar.bookChat({
    hire: { email: hireEmail },
    teammate,
    slot,
    summary: `First Contact: ${hire.name} × ${teammate.name}`,
    description: inviteDescription({ hireFirstName, teammateFirstName: firstName(teammate.name) }),
  })));

  const missing = needed - planned.length;
  // The chats are booked either way, so a failed post shouldn't tell the hire something went wrong
  try {
    await slack.post({
      text: welcomePost({
        hire, planned, missing, isFirstVisit: existing.length === 0,
      }),
    });
  } catch (error) {
    logger.error('[FirstContact] Booked chats but could not post in #welcome', error);
  }

  const booked: BookedChat[] = planned.map(({ teammate, slot }) => ({ teammateEmail: teammate.email, teammateName: teammate.name, start: slot.start.toISOString() }));
  return {
    chats: [...existing, ...booked].sort((a, b) => a.start.localeCompare(b.start)),
    missing,
  };
}

export function inviteDescription({ hireFirstName, teammateFirstName }: { hireFirstName: string; teammateFirstName: string }): string {
  return [
    `Welcome to BlueDot, ${hireFirstName}! This is a 30-minute call to get to know each other.`,
    '',
    'Some questions to start with:',
    ...FIRST_CONTACT_PROMPTS(hireFirstName, teammateFirstName).map((prompt) => `• ${prompt}`),
    '',
    'Can\'t make it? Move this invite to a time that works for you both.',
  ].join('\n');
}

export function welcomePost({
  hire, planned, missing, isFirstVisit,
}: {
  hire: { name: string };
  planned: PlannedChat[];
  missing: number;
  isFirstVisit: boolean;
}): string {
  const hireFirstName = firstName(hire.name);
  const lines = [...planned].sort((a, b) => a.slot.start.getTime() - b.slot.start.getTime()).map(({ teammate, slot }) => `• <@${teammate.slackUserId}> · ${slackDate(slot.start)}`);
  const intro = isFirstVisit
    ? `:wave: *Welcome, ${hire.name}!* ${hireFirstName} is joining BlueDot and will meet:`
    : `:wave: ${hire.name} will also meet:`;
  const shortfall = missing > 0
    ? [`_Couldn't find a time for ${missing} more ${missing === 1 ? 'call' : 'calls'}. Can someone here set ${missing === 1 ? 'it' : 'them'} up with ${hireFirstName}?_`]
    : [];
  if (planned.length === 0) {
    return `:wave: *Welcome, ${hire.name}!* ${hireFirstName} is joining BlueDot, but First Contact couldn't find any free times. Can someone here set up a few calls with ${hireFirstName}?`;
  }

  return [intro, ...lines, ...shortfall].join('\n');
}

/** Slack shows this in each reader's own time zone; the fallback is for clients that can't. */
function slackDate(date: Date): string {
  const fallback = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(date);
  return `<!date^${Math.floor(date.getTime() / 1000)}^{date_short_pretty} at {time}|${fallback} UTC>`;
}

/**
 * Google profile names sometimes hold a placeholder surname like "Agatha ___". Drop any part with no letters or
 * digits, so the invites and the #welcome post just say "Agatha".
 */
export function cleanName(name: string): string {
  const parts = name.split(/\s+/).filter((part) => /[\p{L}\p{N}]/u.test(part));
  return parts.length > 0 ? parts.join(' ') : name.trim();
}

function sameName(a: string, b: string): boolean {
  const normalise = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalise(a) === normalise(b);
}

function firstName(name: string): string {
  return name.split(/\s+/).find(Boolean) ?? name;
}

function getConfig() {
  const config = {
    slackToken: env.WELCOME_SLACK_BOT_TOKEN,
    channelId: env.WELCOME_SLACK_CHANNEL_ID,
    googleRefreshToken: env.WELCOME_GOOGLE_REFRESH_TOKEN,
    calendarId: env.WELCOME_GOOGLE_CALENDAR_ID,
  };
  const missing = Object.entries(config).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length > 0) throw new createHttpError.InternalServerError(`First Contact is not configured: ${missing.join(', ')} missing`);
  return config as { [K in keyof typeof config]: string };
}
