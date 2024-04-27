import { describe, expect, test } from 'vitest';
import { formatOffsetFromMinutesToString, offsets, parseOffsetFromStringToMinutes } from './offset';

describe('parseOffsetFromStringToMinutes', () => {
  test.each([
    ['UTC00:00', 0],
    ['UTC-01:00', 60],
    ['UTC-01:30', 90],
    ['UTC+01:00', -60],
    ['UTC+02:00', -120],
    ['UTC+03:45', -225],
  ])('%s', (timezone, offset) => {
    expect(parseOffsetFromStringToMinutes(timezone)).toBe(offset);
  });
});

test('all offsets can be parsed and stringified to themselves', () => {
  offsets.forEach((offset) => expect(formatOffsetFromMinutesToString(parseOffsetFromStringToMinutes(offset))).toBe(offset));
});
