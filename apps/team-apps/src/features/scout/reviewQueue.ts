import type { Course, QueueItem } from './types';

export const courses: Course[] = ['Technical AI Safety', 'Technical AI Safety Project', 'Biosecurity'];
export const roundKey = (item: QueueItem) => item.roundId ?? `${item.course}:${item.roundName}`;
export const roundLabel = (item: QueueItem) => item.roundName.replace(`${item.course} `, '').replace(/^\((.*?)\)/, '$1');
export const roundsFor = (items: QueueItem[], course: string) => {
  const rounds = new Map<string, QueueItem>();
  items.filter((item) => !course || item.course === course).forEach((item) => rounds.set(roundKey(item), item));
  return [...rounds.values()].sort((a, b) => (b.roundEnd ?? '').localeCompare(a.roundEnd ?? ''));
};

