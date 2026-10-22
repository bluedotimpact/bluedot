import { describe, expect, test } from 'vitest';
import {
  type Teammate, orderTeammates, planChats, searchWindow,
} from './slots';

// Monday 19 Oct 2026, 08:00 in SF
const NOW_MS = Date.parse('2026-10-19T15:00:00Z');
const window = searchWindow({ nowMs: NOW_MS });

const teammate = (name: string, timeZone: string, busy: Teammate['busy'] = []): Teammate => ({
  slackUserId: `U-${name}`, name, email: `${name.toLowerCase()}@bluedot.org`, timeZone, busy,
});

const local = (date: Date, timeZone: string) => new Intl.DateTimeFormat('en-GB', {
  timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).format(date);

const day = (date: Date, timeZone: string) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);

describe('planChats', () => {
  const team = [
    teammate('Alex', 'America/Los_Angeles'),
    teammate('Bilal', 'Europe/London'),
    teammate('Li-Lian', 'America/Los_Angeles'),
    teammate('Nixon', 'America/New_York'),
    teammate('Cosima', 'Europe/London'),
    teammate('Will', 'America/Los_Angeles'),
  ];

  test('books five chats on five different weekdays, in working hours for both people', () => {
    const chats = planChats({
      hire: { timeZone: 'America/Toronto', busy: [] }, teammates: team, window, seed: 'caitlin@example.com',
    });

    expect(chats.map((c) => c.teammate.name)).toEqual(['Alex', 'Bilal', 'Li-Lian', 'Nixon', 'Cosima']);
    expect(new Set(chats.map((c) => day(c.slot.start, 'America/Toronto'))).size).toBe(5);
    for (const { teammate: t, slot } of chats) {
      expect(slot.end.getTime() - slot.start.getTime()).toBe(30 * 60 * 1000);
      expect(slot.start.getTime()).toBeGreaterThanOrEqual(window.start.getTime());
      expect(local(slot.start, t.timeZone)).toMatch(/^(Mon|Tue|Wed|Thu|Fri) (0[89]|1[0-7]):(00|30)$/);
      expect(local(slot.start, 'America/Toronto')).toMatch(/^(Mon|Tue|Wed|Thu|Fri) (0[89]|1\d):(00|30)$/);
    }
  });

  test('avoids busy times and skips teammates with no shared free time', () => {
    const alwaysBusy = [{ start: window.start, end: window.end }];
    const hireBusy = [{ start: new Date('2026-10-20T00:00:00Z'), end: new Date('2026-10-22T00:00:00Z') }];
    const chats = planChats({
      hire: { timeZone: 'America/Toronto', busy: hireBusy },
      teammates: [teammate('Busy', 'America/Los_Angeles', alwaysBusy), ...team],
      window,
      seed: 'caitlin@example.com',
    });

    expect(chats.map((c) => c.teammate.name)).not.toContain('Busy');
    for (const { slot } of chats) {
      expect(slot.end <= hireBusy[0]!.start || slot.start >= hireBusy[0]!.end).toBe(true);
    }
  });

  test('books fewer when asked, and is the same every time for the same seed', () => {
    const plan = () => planChats({
      hire: { timeZone: 'Europe/Paris', busy: [] }, teammates: team, window, seed: 'agatha@example.com', count: 2,
    });
    expect(plan()).toHaveLength(2);
    expect(plan()).toEqual(plan());
  });
});

describe('orderTeammates', () => {
  test('puts people with the fewest recent chats first', () => {
    const ordered = orderTeammates({
      teammates: [{ email: 'a@bluedot.org' }, { email: 'b@bluedot.org' }, { email: 'c@bluedot.org' }],
      pastChats: new Map([['a@bluedot.org', 3], ['b@bluedot.org', 1]]),
      seed: 'hire@example.com',
    });
    expect(ordered.map((t) => t.email)).toEqual(['c@bluedot.org', 'b@bluedot.org', 'a@bluedot.org']);
  });
});
