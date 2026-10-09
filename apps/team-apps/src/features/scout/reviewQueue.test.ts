import { expect, test, vi } from 'vitest';
import { roundPickerLabel, roundsFor } from './reviewQueue';
import type { QueueItem } from './types';

const item = (roundId: string, roundName: string, roundEnd?: string): QueueItem => ({
  id: `rec${roundId}`, course: 'Biosecurity', roundId, roundName, roundEnd, hasCertificate: true, hasReport: false,
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
