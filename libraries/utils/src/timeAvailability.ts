import * as wa from 'weekly-availabilities';
import { parseOffsetFromStringToMinutes } from './timezoneOffset';

export const MINUTES_IN_UNIT = 30;
export const MINUTES_IN_WEEK = 10_080;

/**
 * A weekly availability selection. Keys are minutes since Monday 00:00 (0–10080);
 * a `true` value marks that 30-minute slot as selected. This is the shape produced
 * and consumed by the `TimeAvailabilityGrid` component in `@bluedot/ui`.
 */
export type TimeAvailabilityMap = Record<number, boolean>;

/**
 * Converts a weekly time availability map to intervals.
 * Each selected time slot becomes a 30-minute interval, then merged with unionSchedules.
 */
export const weeklyTimeAvToIntervals = (timeAv: TimeAvailabilityMap): wa.Interval[] => {
  return wa.unionSchedules(Object.entries(timeAv)
    .filter(([, available]) => available)
    .map(([weeklyTime]) => [
      parseInt(weeklyTime),
      parseInt(weeklyTime) + MINUTES_IN_UNIT,
    ] as wa.Interval));
};

/**
 * Converts intervals to a weekly time availability map.
 * Normalizes misaligned intervals by rounding start down and end up to MINUTES_IN_UNIT boundaries.
 */
export const intervalsToWeeklyTimeAv = (intervals: wa.Interval[]): TimeAvailabilityMap => {
  const timeAv: TimeAvailabilityMap = {};
  for (const [start, end] of intervals) {
    // Normalize: round start down and end up to nearest MINUTES_IN_UNIT boundary
    const normalizedStart = Math.floor((start as number) / MINUTES_IN_UNIT) * MINUTES_IN_UNIT;
    const normalizedEnd = Math.ceil((end as number) / MINUTES_IN_UNIT) * MINUTES_IN_UNIT;

    // Mark each MINUTES_IN_UNIT slot within the interval as true
    for (let t = normalizedStart; t < normalizedEnd; t += MINUTES_IN_UNIT) {
      timeAv[t] = true;
    }
  }

  return timeAv;
};

/**
 * Shifts intervals by a given offset in minutes, wrapping around the week boundary.
 */
export const shiftIntervals = (intervals: wa.Interval[], offsetInMinutes: number): wa.Interval[] => {
  const shifted = intervals.flatMap(([b, e]) => {
    if (e - b > MINUTES_IN_WEEK) {
      throw new Error('Invalid weekly interval: greater than MINUTES_IN_WEEK minutes');
    }

    let newB: number = b + offsetInMinutes;
    let newE: number = e + offsetInMinutes;

    while (newB < 0) {
      newB += MINUTES_IN_WEEK;
      newE += MINUTES_IN_WEEK;
    }

    while (newB > MINUTES_IN_WEEK) {
      newB -= MINUTES_IN_WEEK;
      newE -= MINUTES_IN_WEEK;
    }

    if (newE > MINUTES_IN_WEEK) {
      return [
        [0, newE - MINUTES_IN_WEEK],
        [newB, MINUTES_IN_WEEK],
      ] as wa.Interval[];
    }

    return [[newB, newE]] as wa.Interval[];
  });
  // Simplify and merge adjacent intervals
  return wa.unionSchedules(shifted);
};

/**
 * Converts a grid selection (interpreted in `timezone`) into the UTC interval string
 * persisted by the availability/application forms (weekly-availabilities format).
 */
export const gridToUtcIntervalString = (map: TimeAvailabilityMap, timezone: string): string => {
  const intervals = shiftIntervals(
    weeklyTimeAvToIntervals(map),
    parseOffsetFromStringToMinutes(timezone),
  );
  return wa.format(intervals);
};

/**
 * Parses a UTC interval string (weekly-availabilities format) back into a grid selection
 * for `timezone`. Throws if the string is malformed.
 */
export const utcIntervalStringToGrid = (utc: string, timezone: string): TimeAvailabilityMap => {
  const intervalsUtc = wa.parseIntervals(utc);
  const intervalsLocal = shiftIntervals(intervalsUtc, -parseOffsetFromStringToMinutes(timezone));
  return intervalsToWeeklyTimeAv(intervalsLocal);
};
