import type { Course, QueueItem } from './types';

// Picker order: the courses leads review most, then anything else the view contains, alphabetically
const COURSE_ORDER: Course[] = ['Technical AI Safety', 'Technical AI Safety Project', 'Biosecurity', 'AGI Strategy', 'Frontier AI Governance'];
export const coursesIn = (items: QueueItem[]): Course[] => {
  const present = [...new Set(items.map((item) => item.course))];
  const rank = (course: Course) => {
    const i = COURSE_ORDER.indexOf(course);
    return i === -1 ? COURSE_ORDER.length : i;
  };

  return present.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
};

export const roundKey = (item: QueueItem) => item.roundId ?? `${item.course}:${item.roundName}`;
export const roundLabel = (item: QueueItem) => item.roundName.replace(`${item.course} `, '').replace(/^\((.*?)\)/, '$1');
export const roundsFor = (items: QueueItem[], course: string) => {
  const rounds = new Map<string, QueueItem>();
  items.filter((item) => !course || item.course === course).forEach((item) => rounds.set(roundKey(item), item));
  return [...rounds.values()].sort((a, b) => (b.roundEnd ?? '').localeCompare(a.roundEnd ?? ''));
};

