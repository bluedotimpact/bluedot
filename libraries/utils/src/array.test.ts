import { describe, expect, test } from 'vitest';
import { chunk } from './array';

describe('chunk', () => {
  test('splits into consecutive chunks of the given size, last one smaller', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  test('handles an exact multiple of the size', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  test('returns a single chunk when size exceeds length', () => {
    expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  test('returns an empty array for empty input, regardless of size', () => {
    expect(chunk([], 3)).toEqual([]);
    expect(chunk([], 0)).toEqual([]);
  });

  test('throws on a non-positive size for non-empty input (would otherwise loop forever)', () => {
    expect(() => chunk([1, 2, 3], 0)).toThrow(RangeError);
    expect(() => chunk([1, 2, 3], -1)).toThrow(RangeError);
  });
});
