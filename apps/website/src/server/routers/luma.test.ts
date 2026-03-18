import { describe, expect, test } from 'vitest';
import { isPublicLumaEvent } from './luma-utils';

describe('isPublicLumaEvent', () => {
  test('returns true for public events', () => {
    expect(isPublicLumaEvent({
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
      name: 'Unknown visibility event',
      start_at: '2026-03-18T15:00:00Z',
      end_at: '2026-03-18T16:00:00Z',
      timezone: 'UTC',
      url: 'https://lu.ma/unknown-event',
    })).toBe(false);
  });
});
