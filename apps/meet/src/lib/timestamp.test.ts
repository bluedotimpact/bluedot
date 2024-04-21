import { test, expect } from 'vitest';
import { now } from './timestamp';

test('now', () => {
  const result = now();

  // Checks we're at least not off by e.g. an order of magnitude
  expect(result).toBeGreaterThan(1e9); // 2001
  expect(result).toBeLessThan(2e9); // 2033
});
