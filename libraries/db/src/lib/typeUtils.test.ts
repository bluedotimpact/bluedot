/* eslint-disable @typescript-eslint/no-unused-vars */
import { text, numeric, boolean } from 'drizzle-orm/pg-core';
import { describe, expect, test } from 'vitest';
import { type DrizzleColumnToTsType, type AirtableItemFromColumnsMap, drizzleColumnToTsTypeString } from './typeUtils';

// Test DrizzleColumnToTsType for basic types
type TextColumn = ReturnType<typeof text>;
type NumericColumn = ReturnType<typeof numeric<'number'>>;
type BooleanColumn = ReturnType<typeof boolean>;

// Test DrizzleColumnToTsType for array types
type TextArrayColumn = ReturnType<ReturnType<typeof text>['array']>;
type NumericArrayColumn = ReturnType<ReturnType<typeof numeric<'number'>>['array']>;
type BooleanArrayColumn = ReturnType<ReturnType<typeof boolean>['array']>;

// Type tests for DrizzleColumnToTsType
type TextType = DrizzleColumnToTsType<TextColumn>;
type NumericType = DrizzleColumnToTsType<NumericColumn>;
type BooleanType = DrizzleColumnToTsType<BooleanColumn>;
type TextArrayType = DrizzleColumnToTsType<TextArrayColumn>;
type NumericArrayType = DrizzleColumnToTsType<NumericArrayColumn>;
type BooleanArrayType = DrizzleColumnToTsType<BooleanArrayColumn>;

// Test that basic types are correct
const textValue: TextType = 'test';
const textNull: TextType = null;
// @ts-expect-error - should not accept arrays
const textInvalid: TextType = ['test'];

const numericValue: NumericType = 123;
const numericNull: NumericType = null;
// @ts-expect-error - should not accept strings
const numericInvalid: NumericType = 'test';

const booleanValue: BooleanType = true;
const booleanNull: BooleanType = null;
// @ts-expect-error - should not accept strings
const booleanInvalid: BooleanType = 'test';

// Test that array types are correct
const textArrayValue: TextArrayType = ['test', 'test2'];
const textArrayNull: TextArrayType = null;
// @ts-expect-error - should not accept single strings
const textArrayInvalid: TextArrayType = 'test';

const numericArrayValue: NumericArrayType = [1, 2, 3];
const numericArrayNull: NumericArrayType = null;
// @ts-expect-error - should not accept string arrays
const numericArrayInvalid: NumericArrayType = ['test'];

const booleanArrayValue: BooleanArrayType = [true, false];
const booleanArrayNull: BooleanArrayType = null;
// @ts-expect-error - should not accept string arrays
const booleanArrayInvalid: BooleanArrayType = ['test'];

// Test AirtableItemFromColumnsMap with mixed column types
type TestColumnsMap = {
  name: { pgColumn: TextColumn; airtableId: string };
  age: { pgColumn: NumericColumn; airtableId: string };
  isActive: { pgColumn: BooleanColumn; airtableId: string };
  tags: { pgColumn: TextArrayColumn; airtableId: string };
  scores: { pgColumn: NumericArrayColumn; airtableId: string };
  flags: { pgColumn: BooleanArrayColumn; airtableId: string };
};

type TestAirtableItem = AirtableItemFromColumnsMap<TestColumnsMap>;

// Test that the mapped type works correctly
const validItem: TestAirtableItem = {
  id: 'test-id',
  name: 'John Doe',
  age: 30,
  isActive: true,
  tags: ['tag1', 'tag2'],
  scores: [95, 87, 92],
  flags: [true, false, true],
};

const validItemWithNulls: TestAirtableItem = {
  id: 'test-id',
  name: null,
  age: null,
  isActive: null,
  tags: null,
  scores: null,
  flags: null,
};

// Test that invalid assignments are caught
const invalidItem: TestAirtableItem = {
  id: 'test-id',
  name: 'John Doe',
  age: 30,
  isActive: true,
  // @ts-expect-error - should not accept single string for array field
  tags: 'single-tag',
  scores: [95, 87, 92],
  flags: [true, false, true],
};

const invalidItem2: TestAirtableItem = {
  id: 'test-id',
  name: 'John Doe',
  age: 30,
  isActive: true,
  tags: ['tag1', 'tag2'],
  // @ts-expect-error - should not accept string array for numeric array
  scores: ['95', '87', '92'],
  flags: [true, false, true],
};

// Runtime tests to ensure the types work at runtime too
describe('DrizzleColumnToTsType type tests', () => {
  test('should handle basic types correctly', () => {
    // These are compile-time tests, so just ensure they compile
    expect(textValue).toBe('test');
    expect(numericValue).toBe(123);
    expect(booleanValue).toBe(true);
  });

  test('should handle array types correctly', () => {
    expect(textArrayValue).toEqual(['test', 'test2']);
    expect(numericArrayValue).toEqual([1, 2, 3]);
    expect(booleanArrayValue).toEqual([true, false]);
  });

  test('should handle null values correctly', () => {
    expect(textNull).toBeNull();
    expect(numericNull).toBeNull();
    expect(booleanNull).toBeNull();
    expect(textArrayNull).toBeNull();
    expect(numericArrayNull).toBeNull();
    expect(booleanArrayNull).toBeNull();
  });

  test('should create valid AirtableItemFromColumnsMap objects', () => {
    expect(validItem.id).toBe('test-id');
    expect(validItem.name).toBe('John Doe');
    expect(validItem.tags).toEqual(['tag1', 'tag2']);
    expect(validItem.scores).toEqual([95, 87, 92]);
    expect(validItem.flags).toEqual([true, false, true]);
  });
});

describe('drizzleColumnToTsTypeString', () => {
  test.each([
    [text(), 'string | null'],
    [text().notNull(), 'string'],
    [boolean(), 'boolean | null'],
    [boolean().notNull(), 'boolean'],
    [numeric({ mode: 'number' }), 'number | null'],
    [numeric({ mode: 'number' }).notNull(), 'number'],
    [text().array(), 'string[] | null'],
    [text().array().notNull(), 'string[]'],
    [numeric({ mode: 'number' }).array(), 'number[] | null'],
    [numeric({ mode: 'number' }).array().notNull(), 'number[]'],
  ])('%s -> %s', (column, expectedType) => {
    const result = drizzleColumnToTsTypeString(column);
    expect(result).toBe(expectedType);
  });

  test('should throw error for unsupported column type', () => {
    // Create a mock column with unsupported type
    const mockColumn = {
      config: {
        dataType: 'bleh',
        notNull: false,
      },
    };

    expect(() => {
      // @ts-expect-error - we're testing an unsupported type
      drizzleColumnToTsTypeString(mockColumn);
    }).toThrow('Unsupported column type: bleh');
  });
});
