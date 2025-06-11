import { type numeric, boolean as pgBoolean, type text } from 'drizzle-orm/pg-core';

export type AllowedPgColumn =
  ReturnType<typeof text> |
  ReturnType<typeof numeric<'number'>> |
  ReturnType<typeof pgBoolean> |
  ReturnType<ReturnType<typeof text>['array']> |
  ReturnType<ReturnType<typeof numeric<'number'>>['array']> |
  ReturnType<ReturnType<typeof pgBoolean>['array']>;

// BEGIN vendored from airtable-ts/src/mapping/typeUtils.ts
// TODO: Bump airtable-ts version to export these types instead of vendoring them
type NonNullToString<T> =
  T extends string ? 'string' :
    T extends number ? 'number' :
      T extends boolean ? 'boolean' :
        T extends number[] ? 'number[]' :
          T extends string[] ? 'string[]' :
            T extends boolean[] ? 'boolean[]' :
              never;

export type ToTsTypeString<T> =
  null extends T ? `${NonNullToString<T>} | null` : NonNullToString<T>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TsTypeString = NonNullToString<any> | ToTsTypeString<any>;
// END vendored

/**
 * Type-level mapping from drizzle column types to airtable-ts TypeScript type strings.
 * Currently supports numeric -> 'number | null', boolean -> 'boolean | null', arrays, defaults to 'string | null' for others.
 */
export type DrizzleColumnToTsTypeString<T extends AllowedPgColumn> =
  T extends ReturnType<typeof numeric<'number'>> ? 'number | null' :
    T extends ReturnType<typeof pgBoolean> ? 'boolean | null' :
      T extends ReturnType<typeof text>['array'] ? 'string[] | null' :
        T extends ReturnType<typeof numeric<'number'>>['array'] ? 'number[] | null' :
          T extends ReturnType<typeof pgBoolean>['array'] ? 'boolean[] | null' :
            'string | null';

/**
 * Maps a drizzle PgColumnBuilderBase to the corresponding airtable-ts TypeScript type string.
 * Currently supports numeric columns -> 'number | null', boolean columns -> 'boolean | null',
 * array columns, defaults to 'string | null'.
 */
export function drizzleColumnToTsTypeString(pgColumn: AllowedPgColumn): TsTypeString {
  let returnType: TsTypeString;

  if (isArrayColumn(pgColumn)) {
    if (isNumericArrayColumn(pgColumn)) {
      returnType = 'number[] | null';
    } else if (isBooleanArrayColumn(pgColumn)) {
      returnType = 'boolean[] | null';
    } else {
      returnType = 'string[] | null';
    }
  } else if (isNumericColumn(pgColumn)) {
    returnType = 'number | null';
  } else if (isBooleanColumn(pgColumn)) {
    returnType = 'boolean | null';
  } else {
    returnType = 'string | null';
  }

  return returnType;
}

/**
 * Runtime type guard for array columns
 */
function isArrayColumn(column: AllowedPgColumn): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { config } = (column as any);
  return config?.dataType === 'array';
}

/**
 * Runtime type guard for numeric columns
 */
function isNumericColumn(column: AllowedPgColumn): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { config } = (column as any);
  return config?.dataType === 'number';
}

/**
 * Runtime type guard for boolean columns
 */
function isBooleanColumn(column: AllowedPgColumn): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { config } = (column as any);
  return config?.dataType === 'boolean';
}

/**
 * Runtime type guard for numeric array columns
 */
function isNumericArrayColumn(column: AllowedPgColumn): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { config, baseColumn } = (column as any);
  return config?.dataType === 'array' && baseColumn?.config?.dataType === 'number';
}

/**
 * Runtime type guard for boolean array columns
 */
function isBooleanArrayColumn(column: AllowedPgColumn): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { config, baseColumn } = (column as any);
  return config?.dataType === 'array' && baseColumn?.config?.dataType === 'boolean';
}
