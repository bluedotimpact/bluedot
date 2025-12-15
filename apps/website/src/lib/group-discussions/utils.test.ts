import { describe, expect, it } from 'vitest';
import { getDiscussionTimeState } from './utils';

const BASE_TIME_MS = new Date('2024-09-25T10:00:00.000Z').getTime();
const BASE_TIME_SECONDS = BASE_TIME_MS / 1000;
const ONE_HOUR_SECONDS = 3600;

describe('getDiscussionTimeState', () => {
  it('returns "ended" when current time is after end time', () => {
    const discussion = { startDateTime: BASE_TIME_SECONDS - 3600, endDateTime: BASE_TIME_SECONDS - 1800 };
    expect(getDiscussionTimeState({ discussion, currentTimeMs: BASE_TIME_MS })).toBe('ended');
  });

  it('returns "live" when current time is between start and end time', () => {
    const discussion = { startDateTime: BASE_TIME_SECONDS - 1800, endDateTime: BASE_TIME_SECONDS + 1800 };
    expect(getDiscussionTimeState({ discussion, currentTimeMs: BASE_TIME_MS })).toBe('live');
  });

  it('returns "soon" when discussion starts within 1 hour', () => {
    const discussion = { startDateTime: BASE_TIME_SECONDS + 1800, endDateTime: BASE_TIME_SECONDS + 5400 };
    expect(getDiscussionTimeState({ discussion, currentTimeMs: BASE_TIME_MS })).toBe('soon');
  });

  it('returns "upcoming" when discussion starts more than 1 hour away', () => {
    const discussion = { startDateTime: BASE_TIME_SECONDS + ONE_HOUR_SECONDS + 1, endDateTime: BASE_TIME_SECONDS + 2 * ONE_HOUR_SECONDS };
    expect(getDiscussionTimeState({ discussion, currentTimeMs: BASE_TIME_MS })).toBe('upcoming');
  });
});
