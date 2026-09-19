import { expect, test } from 'vitest';
import { buildTimeDeltaString, formatEventDate } from './eventsUtils';

const event = {
  id: 'midnight', title: 'Tokyo meetup', location: 'TOKYO', timezone: 'Asia/Tokyo',
  startAt: '2026-09-30T23:30:00Z', endAt: '2026-10-01T00:30:00Z', url: 'https://luma.com/test',
};

test('date headings and time labels both use venue time across a month boundary', () => {
  expect(formatEventDate(event)).toBe('Thu, Oct 1, 2026');
  expect(buildTimeDeltaString(event, 'en-US')).toContain('Thu 8:30 AM');
});

test('online events use the visitor timezone for both date and time', () => {
  expect(formatEventDate({ ...event, location: 'ONLINE' })).toBe('Wed, Sep 30, 2026');
  expect(buildTimeDeltaString({ ...event, location: 'ONLINE' }, 'en-US')).toContain('Wed 11:30 PM');
});
