import { Table } from 'airtable-ts';
import { BuildColumns } from 'drizzle-orm/column-builder';
import {
  pgTable,
  text,
  PgColumnBuilderBase,
  PgTableWithColumns,
} from 'drizzle-orm/pg-core';

export type PgAirtableColumnInput = {
  pgColumn: PgColumnBuilderBase;
  airtableId: string;
};

type PgAirtableConfig<TColumns extends Record<string, PgAirtableColumnInput>> = {
  baseId: string;
  tableId: string;
  columns: TColumns;
};

type ExtractPgColumns<T extends Record<string, PgAirtableColumnInput>> = {
  [K in keyof T]: T[K]['pgColumn'];
};

type BasePgTableType<
  TTableName extends string,
  TColumnsMap extends Record<string, PgAirtableColumnInput>,
> = PgTableWithColumns<{
  name: TTableName;
  schema: undefined;
  columns: BuildColumns<TTableName, ExtractPgColumns<TColumnsMap>, 'pg'>;
  dialect: 'pg';
}>;

export type PgAirtableTable<
  TTableName extends string,
  TColumnsMap extends Record<string, PgAirtableColumnInput>,
> = BasePgTableType<TTableName, TColumnsMap & { id: PgAirtableColumnInput }> & {
  readonly airtableBaseId: string;
  readonly airtableTableId: string;
  readonly airtableFieldMap: ReadonlyMap<string, string>;
  getAirtableTable(): Table<any>;
};

export function pgAirtable<
    TTableName extends string,
    TColumnsMap extends Record<string, PgAirtableColumnInput>,
>(
  name: TTableName,
  config: PgAirtableConfig<TColumnsMap>,
): PgAirtableTable<TTableName, TColumnsMap> {
  const pgColumns = {
    id: text('id').notNull().primaryKey(),
  } as ExtractPgColumns<TColumnsMap & { id: PgAirtableColumnInput }>;

  const fieldMap = new Map<string, string>();
  for (const columnName of Object.keys(config.columns)) {
    const key = columnName as keyof TColumnsMap;
    const columnConfig = config.columns[key];
    if (columnConfig) {
      pgColumns[key] = columnConfig.pgColumn;
      fieldMap.set(columnName, columnConfig.airtableId);
    }
  }

  const table = pgTable(name, pgColumns);

  const result = Object.assign(table, {
    airtableBaseId: config.baseId,
    airtableTableId: config.tableId,
    airtableFieldMap: fieldMap as ReadonlyMap<string, string>,
    getAirtableTable(): Table<any> {
      const mappings: Record<string, string> = {};
      // TODO infer actual types
      const schema: Record<string, 'string | null'> = {};

      for (const columnName of Object.keys(config.columns).filter((n) => n !== 'id')) {
        const columnConfig = config.columns[columnName as keyof TColumnsMap];
        if (columnConfig) {
          mappings[columnName] = columnConfig.airtableId;
          schema[columnName] = 'string | null';
        }
      }

      return {
        name,
        baseId: config.baseId,
        tableId: config.tableId,
        mappings,
        schema,
      };
    },
  });

  return result;
}

export function isPgAirtableTable(table: any): table is PgAirtableTable<string, any> {
  return table && typeof table === 'object'
         && typeof table.airtableBaseId === 'string'
         && typeof table.airtableTableId === 'string'
         && table.airtableFieldMap instanceof Map
         && typeof table.getAirtableTable === 'function';
}
