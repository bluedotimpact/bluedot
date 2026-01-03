import * as wa from 'weekly-availabilities';

export const MINUTES_IN_UNIT = 30;

export function snapToRect(
  {
    top, bottom, left, right,
  }: { top: number, bottom: number, left: number, right: number },
  { x, y }: { x: number, y: number },
) {
  return {
    // eslint-disable-next-line no-nested-ternary
    x: x < left ? left + 5 : x > right ? right - 5 : x,
    // eslint-disable-next-line no-nested-ternary
    y: y > bottom ? bottom - 5 : y < top ? top + 5 : y,
  };
}

/**
 * Converts a weekly time availability map to intervals.
 * Each selected time slot becomes a 30-minute interval, then merged with unionSchedules.
 */
export const weeklyTimeAvToIntervals = (timeAv: Record<wa.WeeklyTime, boolean>): wa.Interval[] => {
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
export const intervalsToWeeklyTimeAv = (intervals: wa.Interval[]): Record<wa.WeeklyTime, boolean> => {
  const timeAv: Record<number, boolean> = {};
  for (const [start, end] of intervals) {
    // Normalize: round start down and end up to nearest MINUTES_IN_UNIT boundary
    const normalizedStart = Math.floor((start as number) / MINUTES_IN_UNIT) * MINUTES_IN_UNIT;
    const normalizedEnd = Math.ceil((end as number) / MINUTES_IN_UNIT) * MINUTES_IN_UNIT;

    // Mark each MINUTES_IN_UNIT slot within the interval as true
    for (let t = normalizedStart; t < normalizedEnd; t += MINUTES_IN_UNIT) {
      timeAv[t] = true;
    }
  }
  return timeAv as Record<wa.WeeklyTime, boolean>;
};

/**
 * Shifts intervals by a given offset in minutes, wrapping around the week boundary.
 */
export const shiftIntervals = (intervals: wa.Interval[], offsetInMinutes: number): wa.Interval[] => {
  const shifted = intervals.flatMap(([b, e]) => {
    if (e - b > 10080) {
      throw new Error('Invalid weekly interval: greater than 10080 minutes');
    }

    let newB: number = b + offsetInMinutes;
    let newE: number = e + offsetInMinutes;

    while (newB < 0) {
      newB += 10080;
      newE += 10080;
    }

    while (newB > 10080) {
      newB -= 10080;
      newE -= 10080;
    }

    if (newE > 10080) {
      return [
        [0, newE - 10080],
        [newB, 10080],
      ] as wa.Interval[];
    }

    return [[newB, newE]] as wa.Interval[];
  });
  // Simplify and merge adjacent intervals
  return wa.unionSchedules(shifted);
};
