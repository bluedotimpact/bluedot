import { expect, test, vi } from 'vitest';
import {
  backlogFor, mustLookFor, roundPickerLabel, roundsFor,
} from './reviewQueue';
import type { QueueItem } from './types';

const item = (roundId: string, roundName: string, roundEnd?: string, mustLook = false): QueueItem => ({
  id: `rec${roundId}`, course: 'Biosecurity', roundId, roundName, roundEnd, hasCertificate: true, hasReport: false, mustLook,
});
const now = new Date('2026-10-09T12:00:00Z');

test('the picker label leads with the end date, adding the year only when it is not this year', () => {
  expect(roundPickerLabel(item('a', 'Biosecurity (2026 Aug W34) - Part-time', '2026-10-03'), now)).toBe('Ended 3 Oct (2026 Aug W34 - Part-time)');
  expect(roundPickerLabel(item('b', 'Biosecurity (2025 Dec W49) - Part-time', '2025-12-12'), now)).toBe('Ended 12 Dec 2025 (2025 Dec W49 - Part-time)');
  expect(roundPickerLabel(item('c', 'Biosecurity (2026 Sep W37) - Intensive'), now)).toBe('2026 Sep W37 - Intensive');
});

test('the end date reads the same for a viewer behind UTC', () => {
  vi.stubEnv('TZ', 'America/Los_Angeles');
  try {
    expect(roundPickerLabel(item('a', 'Biosecurity (2026 Aug W34) - Part-time', '2026-10-03'), now)).toBe('Ended 3 Oct (2026 Aug W34 - Part-time)');
    expect(roundPickerLabel(item('n', 'Biosecurity (2026 Dec W49) - Part-time', '2026-01-01'), now)).toBe('Ended 1 Jan (2026 Dec W49 - Part-time)');
  } finally {
    vi.unstubAllEnvs();
  }
});

test('rounds are listed by end date, most recent first, so the dates read in order', () => {
  const items = [
    item('jul', 'Biosecurity (2026 Jul W30) - Part-time', '2026-09-05'),
    item('aug', 'Biosecurity (2026 Aug W34) - Part-time', '2026-10-03'),
    item('sep', 'Biosecurity (2026 Sep W37) - Intensive', '2026-09-14'),
  ];
  expect(roundsFor(items, 'Biosecurity').map((r) => r.roundId)).toEqual(['aug', 'sep', 'jul']);
});

test('must look is one queue per course, newest round first, keeping the view order within a round', () => {
  const items = [
    { ...item('jul', 'Biosecurity (2026 Jul W30) - Part-time', '2026-09-05', true), id: 'recJul1' },
    { ...item('aug', 'Biosecurity (2026 Aug W34) - Part-time', '2026-10-03', true), id: 'recAug1' },
    { ...item('aug', 'Biosecurity (2026 Aug W34) - Part-time', '2026-10-03'), id: 'recAugBacklog' },
    { ...item('aug', 'Biosecurity (2026 Aug W34) - Part-time', '2026-10-03', true), id: 'recAug2' },
    { ...item('sep', 'Biosecurity (2026 Sep W37) - Intensive', '2026-09-14', true), id: 'recSep1' },
    { ...item('other', 'AGI Strategy (2026 Sep W39) - Intensive', '2026-10-10', true), id: 'recOtherCourse', course: 'AGI Strategy' as const },
  ];
  expect(mustLookFor(items, 'Biosecurity').map((r) => r.id)).toEqual(['recAug1', 'recAug2', 'recSep1', 'recJul1']);
  expect(backlogFor(items, 'Biosecurity').map((r) => r.id)).toEqual(['recAugBacklog']);
});

test('facilitator endorsements come first on the shortlist, then the newest round', () => {
  const items: QueueItem[] = [
    { ...item('aug', 'Biosecurity (2026 Aug W34) - Part-time', '2026-10-03', true), id: 'recAugStrong', pickReason: 'strong yes' },
    { ...item('sep', 'Biosecurity (2026 Sep W37) - Intensive', '2026-09-14', true), id: 'recSepEndorsed', pickReason: 'endorsement' },
    { ...item('aug', 'Biosecurity (2026 Aug W34) - Part-time', '2026-10-03', true), id: 'recAugEndorsed', pickReason: 'endorsement' },
  ];
  expect(mustLookFor(items, 'Biosecurity').map((r) => r.id)).toEqual(['recAugEndorsed', 'recSepEndorsed', 'recAugStrong']);
});
