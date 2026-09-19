import type { QueueItem } from '../types';
import { roundKey } from '../reviewQueue';

export {
  courses, roundKey, roundLabel, roundsFor,
} from '../reviewQueue';

export const versions = [
  {
    id: 'session', name: 'Focused review', number: '01', description: 'One clear brief, one person at a time. Based on Speed Reviewer.', tradeoff: 'Best for focused review. Less useful for comparing people.',
  },
  {
    id: 'inbox', name: 'Participant inbox', number: '02', description: 'See the whole list, filter it, and open any participant.', tradeoff: 'Best for everyday use. More information on screen.',
  },
  {
    id: 'board', name: 'Shortlist board', number: '03', description: 'Organize people by next step. Review the shortlist before inviting anyone.', tradeoff: 'Best for thinking through a shortlist. Slower for rapid individual decisions.',
  },
] as const;
export type Version = typeof versions[number]['id'];
export type Draft = 'shortlist' | 'pass' | 'later';
export type Filters = { course: string; round: string; search: string; evidence: string; order: string };
export const emptyFilters: Filters = {
  course: '', round: '', search: '', evidence: '', order: 'source',
};
export const filterQueue = (items: QueueItem[], filters: Filters): QueueItem[] => {
  const filtered = items.filter((item) => (!filters.course || item.course === filters.course)
    && (!filters.round || roundKey(item) === filters.round)
    && (!filters.search || (item.name ?? '').toLowerCase().includes(filters.search.trim().toLowerCase()))
    && (filters.evidence !== 'report' || item.hasReport)
    && (filters.evidence !== 'certificate' || item.hasCertificate));
  if (filters.order === 'name') filtered.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  if (filters.order === 'newest') filtered.sort((a, b) => (b.roundEnd ?? '').localeCompare(a.roundEnd ?? ''));
  return filtered;
};

export const draftLabel = (draft?: Draft) => (draft ? { shortlist: 'Shortlisted', pass: 'Don’t invite', later: 'Review later' }[draft] : 'To review');
