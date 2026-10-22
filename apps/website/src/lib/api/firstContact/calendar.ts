// The First Contact calendar, owned by the dewi-bots@bluedot.org bot account. Its token has two narrow scopes: manage
// calendars it created, and see colleagues' free/busy times. The calendar itself is the record of every chat booked.

import { createHash } from 'crypto';
import type { Interval } from './slots';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
// Private extended properties, which only this app can see and which events can be filtered by
const HIRE_PROPERTY = 'firstContactHire';
const TEAMMATE_PROPERTY = 'firstContactTeammate';
const TEAMMATE_NAME_PROPERTY = 'firstContactTeammateName';

export type BookedChat = {
  teammateEmail: string;
  teammateName: string;
  start: string;
};

export class FirstContactCalendar {
  constructor(private readonly accessToken: string, private readonly calendarId: string) {}

  private async request(path: string, init: { method: string; body?: unknown }): Promise<Response> {
    return fetch(`${CALENDAR_API}${path}`, {
      method: init.method,
      headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  }

  /** Busy times per teammate email. Null when Google won't share someone's calendar. */
  async busyTimes({ emails, window }: { emails: string[]; window: Interval }): Promise<Map<string, Interval[] | null>> {
    const result = new Map<string, Interval[] | null>();
    // Google accepts up to 50 calendars per query
    for (let i = 0; i < emails.length; i += 50) {
      const batch = emails.slice(i, i + 50);
      // eslint-disable-next-line no-await-in-loop
      const response = await this.request('/freeBusy', {
        method: 'POST',
        body: { timeMin: window.start.toISOString(), timeMax: window.end.toISOString(), items: batch.map((id) => ({ id })) },
      });
      // eslint-disable-next-line no-await-in-loop
      if (!response.ok) throw new Error(`Google free/busy failed: HTTP ${response.status} ${await response.text()}`);
      // eslint-disable-next-line no-await-in-loop
      const body = await response.json() as { calendars?: Record<string, { busy?: { start: string; end: string }[]; errors?: unknown[] }> };
      for (const email of batch) {
        const calendar = body.calendars?.[email];
        result.set(email, !calendar || calendar.errors?.length
          ? null
          : (calendar.busy ?? []).map((interval) => ({ start: new Date(interval.start), end: new Date(interval.end) })));
      }
    }

    return result;
  }

  /** Every chat booked since `since`, for spreading welcomes around the team and spotting a returning hire. */
  async chatsSince({ since }: { since: Date }): Promise<(BookedChat & { hire: string })[]> {
    const chats: (BookedChat & { hire: string })[] = [];
    let pageToken: string | undefined;
    do {
      const params = new URLSearchParams({ timeMin: since.toISOString(), singleEvents: 'true', maxResults: '2500' });
      if (pageToken) params.set('pageToken', pageToken);
      // Pages depend on the previous one's token
      // eslint-disable-next-line no-await-in-loop
      const response = await this.request(`/calendars/${encodeURIComponent(this.calendarId)}/events?${params}`, { method: 'GET' });
      // eslint-disable-next-line no-await-in-loop
      if (!response.ok) throw new Error(`Google events list failed: HTTP ${response.status} ${await response.text()}`);
      // eslint-disable-next-line no-await-in-loop
      const body = await response.json() as {
        items?: { status?: string; start?: { dateTime?: string }; extendedProperties?: { private?: Record<string, string> } }[];
        nextPageToken?: string;
      };
      for (const event of body.items ?? []) {
        const props = event.extendedProperties?.private;
        if (event.status === 'cancelled' || !props?.[HIRE_PROPERTY] || !props[TEAMMATE_PROPERTY] || !event.start?.dateTime) continue;
        chats.push({
          hire: props[HIRE_PROPERTY],
          teammateEmail: props[TEAMMATE_PROPERTY],
          teammateName: props[TEAMMATE_NAME_PROPERTY] ?? props[TEAMMATE_PROPERTY],
          start: event.start.dateTime,
        });
      }

      pageToken = body.nextPageToken;
    } while (pageToken);

    return chats;
  }

  /**
   * Books the chat with a Meet link and emails both people. The event ID comes from the two emails, so booking the
   * same pair twice keeps the first event rather than making a second.
   */
  async bookChat({
    hire, teammate, slot, summary, description,
  }: {
    hire: { email: string };
    teammate: { email: string; name: string };
    slot: Interval;
    summary: string;
    description: string;
  }): Promise<'booked' | 'already booked'> {
    const id = chatEventId({ hireEmail: hire.email, teammateEmail: teammate.email });
    const response = await this.request(`/calendars/${encodeURIComponent(this.calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`, {
      method: 'POST',
      body: {
        id,
        summary,
        description,
        start: { dateTime: slot.start.toISOString(), timeZone: 'UTC' },
        end: { dateTime: slot.end.toISOString(), timeZone: 'UTC' },
        attendees: [{ email: hire.email }, { email: teammate.email }],
        guestsCanModify: true,
        conferenceData: { createRequest: { requestId: id, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
        extendedProperties: {
          private: {
            [HIRE_PROPERTY]: hire.email.toLowerCase(),
            [TEAMMATE_PROPERTY]: teammate.email.toLowerCase(),
            [TEAMMATE_NAME_PROPERTY]: teammate.name,
          },
        },
      },
    });
    if (response.status === 409) return 'already booked';
    if (!response.ok) throw new Error(`Google event insert failed: HTTP ${response.status} ${await response.text()}`);
    return 'booked';
  }
}

export function chatEventId({ hireEmail, teammateEmail }: { hireEmail: string; teammateEmail: string }): string {
  // Calendar event IDs allow a-v and 0-9; hex digits are a safe subset
  return `fc${createHash('sha256').update(`${hireEmail.toLowerCase()}|${teammateEmail.toLowerCase()}`).digest('hex').slice(0, 40)}`;
}
