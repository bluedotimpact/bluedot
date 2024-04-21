import { describe, expect, test } from 'vitest';
import { offsets, parseOffsetFromStringToMinutes } from './date';

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

  test('all offsets can be parsed', () => {
    offsets.forEach((offset) => expect(() => parseOffsetFromStringToMinutes(offset)).not.toThrow());
  });
});
