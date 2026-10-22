import {
  COURSES, PICK_REASONS, type Course, type Person, type QueueItem,
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

// The course's shortlist: completers first, then by PICK_REASONS (10s before 9s), then most recently
// finished round
const tier = (item: QueueItem) => (item.pickReason ? PICK_REASONS.indexOf(item.pickReason) : PICK_REASONS.length);
// Only the high-feedback group is ordered by score; elsewhere the score is incidental
const score = (item: QueueItem) => (item.pickReason === 'top score' ? item.topScore ?? 0 : 0);
export const mustLookFor = (items: QueueItem[], course: string) => items
  .filter((item) => item.course === course && item.mustLook)
  .sort((a, b) => Number(b.hasCertificate) - Number(a.hasCertificate) || tier(a) - tier(b) || score(b) - score(a) || (b.roundEnd ?? '').localeCompare(a.roundEnd ?? ''));

// The backlog is everyone else, still picked round by round
export const backlogFor = (items: QueueItem[], course: string) => items.filter((item) => item.course === course && !item.mustLook);

// An endorsement is a 1-1 report with an overall take of Strong yes
export const endorsements = (person: Person) => person.reports.filter((r) => r.overallTake?.toLowerCase() === 'strong yes');
export const endorsers = (person: Person): string[] => [...new Set(endorsements(person).map((r) => r.facilitator ?? 'their facilitator'))];

// High facilitator feedback: a total of 9 or 10, or reasoning 5 (the part leads weigh for a call)
export const topScores = (person: Person) => person.facilitatorFeedback
  .filter((fb) => fb.ratingOutOf === 10 && fb.rating !== undefined && (fb.rating >= 9 || fb.ratingReasoning === 5))
  .map((fb) => ({ score: fb.rating!, reasoning: fb.ratingReasoning, name: fb.reviewer ?? 'their facilitator' }))
  .sort((a, b) => b.score - a.score);

export const roundsFor = (items: QueueItem[], course: string) => {
  const rounds = new Map<string, QueueItem>();
  items.filter((item) => !course || item.course === course).forEach((item) => rounds.set(roundKey(item), item));
  return [...rounds.values()].sort((a, b) => (b.roundEnd ?? '').localeCompare(a.roundEnd ?? ''));
};

