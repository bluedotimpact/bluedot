import { BuildColumns } from 'drizzle-orm/column-builder';
import { NodePgClient, NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  PgDatabase, PgInsertBuilder, PgQueryResultHKT, PgTable,

  pgTable, text, PgColumnBuilderBase, PgTableWithColumns,
} from 'drizzle-orm/pg-core';
import { ExtractTablesWithRelations, TablesRelationalConfig } from 'drizzle-orm/relations';
import { Pool } from 'pg';

type PgAirtableColumnInput = {
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

// TODO write wrapper which:
// - passes through read queries to the default drizzle client
// - adds new functions to insert and update
export class PgAirtableDatabase<
  TSchema extends Record<string, unknown> = Record<string, never>,
  TClient extends NodePgClient = Pool,
> {
  public readDb: NodePgDatabase<TSchema> & {
    $client: TClient;
  };

  public writeDb: NodePgDatabase<TSchema> & {
    $client: TClient;
  };

  constructor(readDb: typeof this.readDb, writeDb: typeof this.writeDb) {
    this.readDb = readDb;
    this.writeDb = writeDb;
  }
}

export type PgAirtableTable<
  TTableName extends string,
  TColumnsMap extends Record<string, PgAirtableColumnInput>,
> = BasePgTableType<TTableName, TColumnsMap & { id: PgAirtableColumnInput }> & {
  readonly airtableBaseId: string;
  readonly airtableTableId: string;
  readonly airtableFieldMap: ReadonlyMap<string, string>;
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
  });

  return result;
}

// TODO fix types
export function isPgAirtableTable(table: any): table is PgAirtableTable<string, any> {
  return table && typeof table === 'object'
         && typeof table.airtableBaseId === 'string'
         && typeof table.airtableTableId === 'string'
         && table.airtableFieldMap instanceof Map;
}
