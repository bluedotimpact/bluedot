import { BuildColumns } from 'drizzle-orm/column-builder';
import {
  pgTable, text, PgColumnBuilderBase, PgTableWithColumns,
  boolean,
} from 'drizzle-orm/pg-core';

// Storage for Airtable metadata, TODO ideally cut
export const airtableTableMetadata = new Map<string, { baseId: string, tableId: string }>();
export const airtableColumnMetadata = new Map<string, Map<string, string>>();

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

type PgAirtableResult<
    TTableName extends string,
    TColumnsMap extends Record<string, PgAirtableColumnInput>,
> = PgTableWithColumns<{
  name: TTableName;
  schema: undefined;
  columns: BuildColumns<TTableName, ExtractPgColumns<TColumnsMap>, 'pg'>;
  dialect: 'pg';
}>;

export function pgAirtable<
    TTableName extends string,
    TColumnsMap extends Record<string, PgAirtableColumnInput>,
>(
  name: TTableName,
  config: PgAirtableConfig<TColumnsMap>,
): PgAirtableResult<TTableName, TColumnsMap & { id: PgAirtableColumnInput }> {
  airtableTableMetadata.set(name, { baseId: config.baseId, tableId: config.tableId });

  const pgColumns = {
    id: text('id').notNull().primaryKey(),
  } as ExtractPgColumns<TColumnsMap & { id: PgAirtableColumnInput }>;

  const columnMetadata = new Map<string, string>();
  for (const columnName of Object.keys(config.columns)) {
    const key = columnName as keyof TColumnsMap;
    const columnConfig = config.columns[key];
    if (columnConfig) {
      pgColumns[key] = columnConfig.pgColumn;
      columnMetadata.set(columnName, columnConfig.airtableId);
    }
  }
  airtableColumnMetadata.set(name, columnMetadata);

  const table = pgTable(name, pgColumns);

  return table;
}

export const metaTable = pgTable('meta', {
  enabled: boolean().default(true),
  airtableBaseId: text().notNull(),
  airtableTableId: text().notNull(),
  airtableFieldId: text().notNull(),
  pgTable: text().notNull(),
  pgField: text().notNull(),
});

export const userTable = pgAirtable('user', {
  baseId: 'appnJbsG1eWbAdEvf',
  tableId: 'tblCgeKADNDSCXPpR',
  columns: {
    email: {
      pgColumn: text().notNull(),
      airtableId: 'fldLAGRfn7S6uEVRo',
    },
  },
});
