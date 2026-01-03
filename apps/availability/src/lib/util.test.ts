import { describe, expect, test } from 'vitest';
import * as wa from 'weekly-availabilities';
import {
  weeklyTimeAvToIntervals,
  intervalsToWeeklyTimeAv,
} from './util';

describe('weeklyTimeAvToIntervals and intervalsToWeeklyTimeAv', () => {
  test('round-trips correctly for normal availability', () => {
    const timeAv = {
      540: true, // Monday 9:00
      570: true, // Monday 9:30
      600: true, // Monday 10:00
    } as Record<wa.WeeklyTime, boolean>;

    const intervals = weeklyTimeAvToIntervals(timeAv);
    const result = intervalsToWeeklyTimeAv(intervals);

    expect(intervals).toEqual([[540, 630]]);
    expect(result).toEqual({ 540: true, 570: true, 600: true });
  });

  test('round-trips correctly for intervals crossing day boundary', () => {
    // Sunday 23:00 to Monday 01:00 (crosses week boundary at 10080)
    const timeAv = {
      10020: true, // Sunday 23:00
      10050: true, // Sunday 23:30
      0: true, // Monday 00:00
      30: true, // Monday 00:30
    } as Record<wa.WeeklyTime, boolean>;

    const intervals = weeklyTimeAvToIntervals(timeAv);
    const result = intervalsToWeeklyTimeAv(intervals);

    expect(result).toEqual({
      0: true, 30: true, 10020: true, 10050: true,
    });
  });

  test('normalizes misaligned intervals to 30-minute boundaries', () => {
    // Interval from 545 to 595 (not on 30-min boundaries)
    // Should normalize to 540-600 (round start down, end up)
    const intervals = [[545, 595]] as wa.Interval[];
    const result = intervalsToWeeklyTimeAv(intervals);

    expect(result).toEqual({ 540: true, 570: true });
  });

  test('handles tiny misaligned interval within a single slot', () => {
    // Interval from 545 to 555 spans one 30-min slot (540-570)
    const intervals = [[545, 555]] as wa.Interval[];
    const result = intervalsToWeeklyTimeAv(intervals);

    expect(result).toEqual({ 540: true });
  });
});
