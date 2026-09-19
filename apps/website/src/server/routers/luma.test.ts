import { describe, expect, test } from 'vitest';
import { buildListEventsUrl, getLumaLocation, isPublicLumaEvent } from './luma-utils';

describe('isPublicLumaEvent', () => {
  test('returns true for public events', () => {
    expect(isPublicLumaEvent({
      id: 'test-event',
      name: 'Public event',
      start_at: '2026-03-18T15:00:00Z',
      end_at: '2026-03-18T16:00:00Z',
      timezone: 'UTC',
      url: 'https://lu.ma/public-event',
      visibility: 'public',
    })).toBe(true);
  });

  test('returns false for private events', () => {
    expect(isPublicLumaEvent({
      id: 'test-event',
      name: 'Private event',
      start_at: '2026-03-18T15:00:00Z',
      end_at: '2026-03-18T16:00:00Z',
      timezone: 'UTC',
      url: 'https://lu.ma/private-event',
      visibility: 'private',
    })).toBe(false);
  });

  test('returns false when visibility is missing', () => {
    expect(isPublicLumaEvent({
      id: 'test-event',
      name: 'Unknown visibility event',
      start_at: '2026-03-18T15:00:00Z',
      end_at: '2026-03-18T16:00:00Z',
      timezone: 'UTC',
      url: 'https://lu.ma/unknown-event',
    })).toBe(false);
  });
});

const event = {
  id: 'test', name: 'Retreat', start_at: '2026-11-13T19:00:00Z', end_at: '2026-11-15T18:00:00Z', timezone: 'America/New_York', url: 'https://luma.com/retreat',
};

test('includes managed, submitted, and external events on every page', () => {
  const url = buildListEventsUrl({ after: event.start_at, cursor: 'next-page' });
  expect(url.pathname).toBe('/v1/calendars/events/list');
  expect(url.searchParams.getAll('access')).toEqual(['manage', 'view']);
  expect(url.searchParams.getAll('platforms')).toEqual(['luma', 'external']);
  expect(url.searchParams.get('pagination_cursor')).toBe('next-page');
  expect(url.searchParams.get('after')).toBe(event.start_at);
});

test('does not mistake missing cities or undisclosed locations for online events', () => {
  expect(getLumaLocation({ ...event, location_type: 'offline', geo_address_json: { city: null, region: 'New York' } })).toBe('NEW YORK');
  expect(getLumaLocation({ ...event, location_type: 'offline' })).toBe('IN PERSON');
  expect(getLumaLocation(event)).toBe('LOCATION TBC');
  expect(getLumaLocation({ ...event, location_type: 'zoom' })).toBe('ONLINE');
});

test('includes external calendar listings without relaxing visibility for Luma events', () => {
  expect(isPublicLumaEvent({ ...event, platform: 'external' })).toBe(true);
  expect(isPublicLumaEvent({ ...event, platform: 'luma' })).toBe(false);
  expect(isPublicLumaEvent({ ...event, platform: 'external', visibility: 'private' })).toBe(false);
});

test.each(['discord', 'meet', 'twitch', 'twitter', 'youtube', 'zoom', 'unknown'])('recognizes Luma online location type %s', (locationType) => {
  expect(getLumaLocation({ ...event, location_type: locationType })).toBe('ONLINE');
});
