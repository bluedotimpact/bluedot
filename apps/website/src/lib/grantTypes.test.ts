import { describe, expect, test } from 'vitest';
import { getGrantPath, isGrantTypeSlug } from './grantTypes';

describe('getGrantPath', () => {
  test('returns the canonical path for a launched grant type', () => {
    expect(getGrantPath('career-transition')).toBe('/grants/career-transition');
    expect(getGrantPath('rapid')).toBe('/grants/rapid');
  });

  test('returns undefined for unlaunched or unknown slugs', () => {
    expect(getGrantPath('seed')).toBeUndefined();
    expect(getGrantPath('rapid-grants')).toBeUndefined();
    expect(getGrantPath('toString')).toBeUndefined();
  });

  test('returns undefined for missing slugs', () => {
    expect(getGrantPath(null)).toBeUndefined();
    expect(getGrantPath(undefined)).toBeUndefined();
    expect(getGrantPath('')).toBeUndefined();
  });
});

describe('isGrantTypeSlug', () => {
  test('recognises launched grant types only', () => {
    expect(isGrantTypeSlug('rapid')).toBe(true);
    expect(isGrantTypeSlug('career-transition')).toBe(true);
    expect(isGrantTypeSlug('incubator-week')).toBe(false);
    expect(isGrantTypeSlug(null)).toBe(false);
  });
});
