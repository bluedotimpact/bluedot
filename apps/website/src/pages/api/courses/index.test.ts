import { describe, expect, test } from 'vitest';
import { buildFormula } from './index';

describe('buildFormula', () => {
  test('should return the base formula when no filters are provided', () => {
    const expectedFormula = '{Display on Course Hub index} = TRUE()';
    expect(buildFormula({})).toBe(expectedFormula);
    expect(buildFormula({ cadence: undefined, level: undefined })).toBe(expectedFormula);
  });

  test('should return the correct formula when only cadence is provided (multiple values)', () => {
    const expectedFormula = 'AND({Display on Course Hub index} = TRUE(), OR({Cadence} = "MOOC", {Cadence} = "Weekly"))';
    expect(buildFormula({ cadence: ['MOOC', 'Weekly'] })).toBe(expectedFormula);
  });

  test('should return the correct formula when only level is provided (multiple values)', () => {
    const expectedFormula = 'AND({Display on Course Hub index} = TRUE(), OR({Level} = "Beginner", {Level} = "Intermediate"))';
    expect(buildFormula({ level: ['Beginner', 'Intermediate'] })).toBe(expectedFormula);
  });

  test('should return the correct formula when both cadence and level are provided (multiple values)', () => {
    const expectedFormula = 'AND({Display on Course Hub index} = TRUE(), OR({Cadence} = "MOOC", {Cadence} = "Weekly"), OR({Level} = "Beginner", {Level} = "Intermediate"))';
    expect(buildFormula({ cadence: ['MOOC', 'Weekly'], level: ['Beginner', 'Intermediate'] })).toBe(expectedFormula);
  });

  test('should generate two OR() clauses when both cadence and level are empty arrays', () => {
    const expectedFormula = 'AND({Display on Course Hub index} = TRUE(), OR(), OR())';
    expect(buildFormula({ cadence: [], level: [] })).toBe(expectedFormula);
  });
});
