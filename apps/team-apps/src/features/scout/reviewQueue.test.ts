import { expect, test } from 'vitest';
import type { QueueItem } from './types';
import { roundKey, roundsFor } from './reviewQueue';

test('keeps distinct round IDs separate even when their course and round names match', () => {
  const first: QueueItem = {
    id: 'first-person', course: 'Technical AI Safety', roundName: 'Same round name', roundId: 'first-round', hasCertificate: false, hasReport: true,
  };
  const other = { ...first, id: 'another-person', roundId: 'another-round' };
  expect(roundKey(first)).not.toBe(roundKey(other));
  expect(roundsFor([first, other], first.course)).toHaveLength(2);
});
