import { COURSES, type Course, type QueueItem } from './types';

export const courses: readonly Course[] = COURSES;
export const roundKey = (item: QueueItem) => item.roundId ?? `${item.course}:${item.roundName}`;
export const roundLabel = (item: QueueItem) => item.roundName.replace(`${item.course} `, '').replace(/^\((.*?)\)/, '$1');

// The picker lists rounds by end date, so it leads with it: "Ended 3 Oct (2026 Aug W34 - Part-time)".
// The year only shows when it differs from this year.
export const roundPickerLabel = (item: QueueItem, now = new Date()) => {
  if (!item.roundEnd) return roundLabel(item);
  // A date-only value is midnight UTC; read it in UTC so viewers west of London see the same day
  const end = new Date(item.roundEnd);
  const sameYear = end.getUTCFullYear() === now.getFullYear();
  const date = end.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', timeZone: 'UTC', ...(sameYear ? {} : { year: 'numeric' }),
  });

  return `Ended ${date} (${roundLabel(item)})`;
};

export const roundsFor = (items: QueueItem[], course: string) => {
  const rounds = new Map<string, QueueItem>();
  items.filter((item) => !course || item.course === course).forEach((item) => rounds.set(roundKey(item), item));
  return [...rounds.values()].sort((a, b) => (b.roundEnd ?? '').localeCompare(a.roundEnd ?? ''));
};

