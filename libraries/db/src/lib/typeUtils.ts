import { type ColumnBuilderRuntimeConfig } from 'drizzle-orm';
import { type BuildColumns } from 'drizzle-orm/column-builder';
import {
  type numeric, type boolean as pgBoolean, type PgTableWithColumns, type text,
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

export type DrizzleColumnToTsType<T extends AllowedPgColumn> =
  T extends ReturnType<ReturnType<typeof text>['array']> ? string[] | null :
    T extends ReturnType<ReturnType<typeof numeric<'number'>>['array']> ? number[] | null :
      T extends ReturnType<ReturnType<typeof pgBoolean>['array']> ? boolean[] | null :
        T extends ReturnType<typeof numeric<'number'>> ? number | null :
          T extends ReturnType<typeof pgBoolean> ? boolean | null :
            string | null;

export type PgAirtableColumnInput = {
  pgColumn: AllowedPgColumn;
  airtableId: string;
};

export type DeprecatedPgAirtableColumnInput = {
  pgColumn: AllowedPgColumn;
  airtableId: string;
  // Doesn't do anything. Required so if you land in a random place in schema.ts you know whether you're looking at deprecated or active columns.
  deprecated: true;
};

/**
 * Rejects any column with .notNull(). Airtable cannot guarantee non-null values,
 * so all pgAirtable columns must be nullable.
 */
type RejectNotNull<T extends Record<string, PgAirtableColumnInput>> = {
  [K in keyof T]: T[K]['pgColumn'] extends { _: { notNull: true } }
    ? Omit<T[K], 'pgColumn'> & { pgColumn: never }
    : T[K]
};

export type PgAirtableConfig<
  TColumns extends Record<string, PgAirtableColumnInput>,
> = {
  baseId: string;
  tableId: string;
  columns: RejectNotNull<TColumns>;
  deprecatedColumns?: Record<string, DeprecatedPgAirtableColumnInput>;
};

export type ExtractPgColumns<T extends Record<string, PgAirtableColumnInput>> = {
  [K in keyof T]: T[K]['pgColumn'];
};

export type AirtableItemFromColumnsMap<
  TColumnsMap extends Record<string, PgAirtableColumnInput>,
> = {
  id: string;
} & {
  [K in keyof TColumnsMap]: DrizzleColumnToTsType<TColumnsMap[K]['pgColumn']>;
};

export type BasePgTableType<
  TTableName extends string,
  TColumnsMap extends Record<string, PgAirtableColumnInput>,
> = Omit<PgTableWithColumns<{
  name: TTableName;
  schema: undefined;
  columns: BuildColumns<TTableName, ExtractPgColumns<TColumnsMap>, 'pg'>;
  dialect: 'pg';
}>, 'id'> & PgTableWithColumns<{
  name: TTableName;
  schema: undefined;
  columns: BuildColumns<TTableName, { id: ReturnType<ReturnType<typeof text>['primaryKey']> }, 'pg'>;
  dialect: 'pg';
}>;

/**
 * Maps a drizzle PgColumnBuilderBase to the corresponding airtable-ts TypeScript type string.
 * Currently supports numeric columns -> 'number | null', boolean columns -> 'boolean | null',
 * array columns, defaults to 'string | null'.
 */
export function drizzleColumnToTsTypeString(pgColumn: AllowedPgColumn): TsTypeString {
  // @ts-expect-error
  const columnConfig: ColumnBuilderRuntimeConfig<unknown> = pgColumn.config;
  // @ts-expect-error
  const baseColumnConfig: ColumnBuilderRuntimeConfig<unknown> | undefined = columnConfig.baseBuilder?.config;

  const baseType = baseColumnConfig?.dataType ?? columnConfig.dataType;
  const isArray = columnConfig.dataType === 'array';
  const isNullable = !columnConfig.notNull;

  if (!['string', 'number', 'boolean'].includes(baseType)) {
    throw new Error(`Unsupported column type: ${baseType}`);
  }

  return `${baseType}${isArray ? '[]' : ''}${isNullable ? ' | null' : ''}` as TsTypeString;
}
