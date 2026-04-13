import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { getDeadlineThresholdUtc } from './course-rounds';

describe('getDeadlineThresholdUtc', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the start of the current UTC day', () => {
    vi.setSystemTime(new Date('2026-04-13T10:45:00.000Z'));

    expect(getDeadlineThresholdUtc().toISOString()).toBe('2026-04-13T00:00:00.000Z');
  });

  it('does not roll over until the UTC date changes', () => {
    vi.setSystemTime(new Date('2026-04-13T23:59:59.000Z'));

    expect(getDeadlineThresholdUtc().toISOString()).toBe('2026-04-13T00:00:00.000Z');
  });
});
