import {
  COURSES, type Course, type Person, type QueueItem,
} from './types';

export const courses: readonly Course[] = ['Technical AI Safety Project', ...COURSES.filter((course) => course !== 'Technical AI Safety Project')];
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

// The course's shortlist: endorsements, then 10s, reasoning 5s, 9s, then strong yes. Within each,
// the most recently finished round first, then completers first
const tier = (item: QueueItem) => {
  if (item.pickReason === 'endorsement') return 0;
  if (item.pickReason === 'top score') {
    if ((item.topScore ?? 0) >= 10) return 1;
    return item.topReasoning === 5 ? 2 : 3;
  }

  return item.pickReason === 'strong yes' ? 4 : 5;
};

export const mustLookFor = (items: QueueItem[], course: string) => items
  .filter((item) => item.course === course && item.mustLook)
  .sort((a, b) => tier(a) - tier(b) || (b.roundEnd ?? '').localeCompare(a.roundEnd ?? '') || Number(b.hasCertificate) - Number(a.hasCertificate));

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

