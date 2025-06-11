import { type numeric, boolean as pgBoolean, type text } from 'drizzle-orm/pg-core';

export type AllowedPgColumn =
  ReturnType<typeof text> |
  ReturnType<typeof numeric<'number'>> |
  ReturnType<typeof pgBoolean>;

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
 * Currently supports numeric -> 'number | null', boolean -> 'boolean | null', defaults to 'string | null' for others.
 */
export type DrizzleColumnToTsTypeString<T extends AllowedPgColumn> =
  T extends ReturnType<typeof numeric<'number'>> ? 'number | null' :
    T extends ReturnType<typeof pgBoolean> ? 'boolean | null' :
      'string | null';

/**
 * Maps a drizzle PgColumnBuilderBase to the corresponding airtable-ts TypeScript type string.
 * Currently supports numeric columns -> 'number | null', boolean columns -> 'boolean | null', defaults to 'string | null'.
 */
export function drizzleColumnToTsTypeString(pgColumn: AllowedPgColumn): TsTypeString {
  let returnType: TsTypeString;

  if (isNumericColumn(pgColumn)) {
    returnType = 'number | null';
  } else if (isBooleanColumn(pgColumn)) {
    returnType = 'boolean | null';
  } else {
    returnType = 'string | null';
  }

  return returnType;
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
