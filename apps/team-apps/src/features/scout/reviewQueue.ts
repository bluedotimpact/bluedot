import {
  COURSES, type Course, type Person, type QueueItem,
} from './types';

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

// The course's must-look people across rounds: facilitator endorsements first (a lead's decision on
// them also closes the loop with the facilitator), then most recently finished round first (that is
// when the certificate, facilitator feedback and project land); within a round, the view's order
export const mustLookFor = (items: QueueItem[], course: string) => items
  .filter((item) => item.course === course && item.mustLook)
  .sort((a, b) => Number(b.pickReason === 'endorsement') - Number(a.pickReason === 'endorsement') || (b.roundEnd ?? '').localeCompare(a.roundEnd ?? ''));

// The backlog is everyone else, still picked round by round
export const backlogFor = (items: QueueItem[], course: string) => items.filter((item) => item.course === course && !item.mustLook);

// The facilitators who endorsed this person: a 1-1 report with an overall take of Strong yes.
// The decision dialog uses it to say who will hear about the decision.
export const endorsers = (person: Person): string[] => [...new Set(person.reports
  .filter((r) => r.overallTake?.toLowerCase() === 'strong yes')
  .map((r) => r.facilitator ?? 'their facilitator'))];

export const roundsFor = (items: QueueItem[], course: string) => {
  const rounds = new Map<string, QueueItem>();
  items.filter((item) => !course || item.course === course).forEach((item) => rounds.set(roundKey(item), item));
  return [...rounds.values()].sort((a, b) => (b.roundEnd ?? '').localeCompare(a.roundEnd ?? ''));
};

