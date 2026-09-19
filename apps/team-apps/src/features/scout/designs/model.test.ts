import { expect, test } from 'vitest';
import { demoQueue } from './demo';
import { emptyFilters, filterQueue, roundsFor } from './model';

test('filters by stable round identity even when two rounds have the same name', () => {
  const first = demoQueue[0]!;
  const other = { ...first, id: 'another-person', roundId: 'a-distinct-round' };
  expect(filterQueue([first, other], { ...emptyFilters, round: first.roundId! })).toEqual([first]);
  expect(roundsFor([first, other], first.course)).toHaveLength(2);
});

test('course, round, name and evidence filters combine without changing source order', () => {
  const source = [...demoQueue].reverse();
  const filtered = filterQueue(source, { ...emptyFilters, course: 'Technical AI Safety', evidence: 'report' });
  expect(filtered.every((item) => item.course === 'Technical AI Safety' && item.hasReport)).toBe(true);
  expect(filtered.map((item) => item.id)).toEqual(source.filter((item) => item.course === 'Technical AI Safety' && item.hasReport).map((item) => item.id));
  expect(filterQueue(source, { ...emptyFilters, search: '  ALEX  ' })).toEqual([demoQueue[0]]);
  expect(filterQueue(source, { ...emptyFilters, course: 'Biosecurity', round: demoQueue[0]!.roundId! })).toEqual([]);
});

test('sort choices do not reorder the underlying queue', () => {
  const before = demoQueue.map((item) => item.id);
  const sorted = filterQueue(demoQueue, { ...emptyFilters, order: 'name' });
  expect(sorted[0]!.name).toBe('Alex Morgan');
  expect(demoQueue.map((item) => item.id)).toEqual(before);
});
