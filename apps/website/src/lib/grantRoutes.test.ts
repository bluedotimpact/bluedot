import { describe, expect, test } from 'vitest';
import { getGrantPath } from './grantRoutes';

describe('getGrantPath', () => {
  test('returns the canonical path for a launched grant', () => {
    expect(getGrantPath('career-transition-grant')).toBe('/grants/career-transition');
    expect(getGrantPath('rapid-grants')).toBe('/grants/rapid');
  });

  test('does not treat inherited object properties as grant slugs', () => {
    expect(getGrantPath('toString')).toBeUndefined();
    expect(getGrantPath('constructor')).toBeUndefined();
  });

  test('returns undefined for missing slugs', () => {
    expect(getGrantPath(null)).toBeUndefined();
    expect(getGrantPath(undefined)).toBeUndefined();
    expect(getGrantPath('')).toBeUndefined();
  });
});
