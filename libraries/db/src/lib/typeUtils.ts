import { BuildColumns } from 'drizzle-orm/column-builder';
import {
  type numeric, boolean as pgBoolean, PgTableWithColumns, text,
} from 'drizzle-orm/pg-core';

// BEGIN vendored from airtable-ts/src/mapping/typeUtils.ts
// TODO: Bump airtable-ts version to export these types instead of vendoring
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

export type AllowedPgColumn =
  ReturnType<typeof text> |
  ReturnType<typeof numeric<'number'>> |
  ReturnType<typeof pgBoolean> |
  ReturnType<ReturnType<typeof text>['array']> |
  ReturnType<ReturnType<typeof numeric<'number'>>['array']> |
  ReturnType<ReturnType<typeof pgBoolean>['array']>;

export type DrizzleColumnToTsTypeString<T extends AllowedPgColumn> =
  T extends ReturnType<typeof numeric<'number'>> ? 'number | null' :
    T extends ReturnType<typeof pgBoolean> ? 'boolean | null' :
      T extends ReturnType<typeof text>['array'] ? 'string[] | null' :
        T extends ReturnType<typeof numeric<'number'>>['array'] ? 'number[] | null' :
          T extends ReturnType<typeof pgBoolean>['array'] ? 'boolean[] | null' :
            'string | null';

export type PgAirtableColumnInput = {
  pgColumn: AllowedPgColumn;
  airtableId: string;
};

export type PgAirtableConfig<TColumns extends Record<string, PgAirtableColumnInput>> = {
  baseId: string;
  tableId: string;
  columns: TColumns;
};

const textPrimaryKey = text().primaryKey();

export type ExtractPgColumns<T extends Record<string, PgAirtableColumnInput>> = {
  [K in keyof T]: K extends 'id' ? never : T[K]['pgColumn'];
} & {
  id: typeof textPrimaryKey;
};

export type AirtableItemFromColumnsMap<
  TColumnsMap extends Record<string, PgAirtableColumnInput>,
> = {
  id: string;
} & {
  [K in keyof TColumnsMap]: TColumnsMap[K]['pgColumn'] extends AllowedPgColumn
    ? DrizzleColumnToTsTypeString<TColumnsMap[K]['pgColumn']> extends `${infer BaseType} | null`
      ? BaseType extends 'string' ? string | null
        : BaseType extends 'number' ? number | null
          : BaseType extends 'boolean' ? boolean | null
            : string | null
      : string | null
    : string | null;
};

export type BasePgTableType<
  TTableName extends string,
  TColumnsMap extends Record<string, PgAirtableColumnInput>,
> = PgTableWithColumns<{
  name: TTableName;
  schema: undefined;
  columns: BuildColumns<TTableName, ExtractPgColumns<TColumnsMap>, 'pg'>;
  dialect: 'pg';
}>;

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

function isArrayColumn(column: AllowedPgColumn): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { config } = (column as any);
  return config?.dataType === 'array';
}

function isNumericColumn(column: AllowedPgColumn): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { config } = (column as any);
  return config?.dataType === 'number';
}

function isBooleanColumn(column: AllowedPgColumn): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { config } = (column as any);
  return config?.dataType === 'boolean';
}

function isNumericArrayColumn(column: AllowedPgColumn): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { config, baseColumn } = (column as any);
  return config?.dataType === 'array' && baseColumn?.config?.dataType === 'number';
}

function isBooleanArrayColumn(column: AllowedPgColumn): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { config, baseColumn } = (column as any);
  return config?.dataType === 'array' && baseColumn?.config?.dataType === 'boolean';
}
