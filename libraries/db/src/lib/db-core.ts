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

export type AirtableItemFromColumnsMap<
  TColumnsMap extends Record<string, PgAirtableColumnInput>,
> = {
  id: string;
} & {
  [K in keyof TColumnsMap]: string | null;
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

// The old PgAirtableTable type is replaced by this class definition.
export class PgAirtableTable<
  TTableName extends string,
  TColumnsMap extends Record<string, PgAirtableColumnInput>,
> {
  public readonly pg: BasePgTableType<TTableName, TColumnsMap & { id: { pgColumn: ReturnType<typeof text>, airtableId: string } }>;

  public readonly airtable: Table<AirtableItemFromColumnsMap<TColumnsMap>>;

  public readonly airtableFieldMap: ReadonlyMap<string, string>;

  private readonly tableName: TTableName;

  private readonly columnsConfig: TColumnsMap;

  constructor(name: TTableName, config: PgAirtableConfig<TColumnsMap>) {
    this.tableName = name;
    this.columnsConfig = config.columns;

    // Initialise Postgres
    const drizzleTableColsBuilder: Record<string, PgColumnBuilderBase> = {
      id: text('id').notNull().primaryKey(),
    };

    for (const [columnName, columnConfig] of Object.entries(config.columns)) {
      drizzleTableColsBuilder[columnName] = columnConfig.pgColumn;
    }

    // TODO what's going on with the type here
    const finalPgColumns: ExtractPgColumns<TColumnsMap & { id: PgAirtableColumnInput }> = drizzleTableColsBuilder as ExtractPgColumns<TColumnsMap & { id: PgAirtableColumnInput }>;

    this.pg = pgTable(name, finalPgColumns) as BasePgTableType<TTableName, TColumnsMap & { id: PgAirtableColumnInput }>;

    // Initialise Airtable
    const fieldMap = new Map<string, string>();
    for (const [columnName, columnConfig] of Object.entries(config.columns)) {
      fieldMap.set(columnName, columnConfig.airtableId);
    }

    // TODO can probably drop this variable
    this.airtableFieldMap = fieldMap;

    const mappings: Record<string, string> = {};
    const schema: Record<string, 'string | null'> = {};

    for (const [columnName, columnConfig] of Object.entries(this.columnsConfig)) {
      if (columnName !== 'id') {
        mappings[columnName] = columnConfig.airtableId;
        // TODO use correct type
        schema[columnName] = 'string | null';
      }
    }

    this.airtable = {
      name: this.tableName,
      baseId: config.baseId,
      tableId: config.tableId,
      // TODO fix
      // @ts-expect-error
      mappings,
      // TODO fix
      // @ts-expect-error
      schema,
    };
  }
}

export function pgAirtable<
    TTableName extends string,
    TColumnsMap extends Record<string, PgAirtableColumnInput>,
>(
  name: TTableName,
  config: PgAirtableConfig<TColumnsMap>,
): PgAirtableTable<TTableName, TColumnsMap> {
  return new PgAirtableTable(name, config);
}

export function isPgAirtableTable(table: unknown): table is PgAirtableTable<string, Record<string, PgAirtableColumnInput>> {
  return table instanceof PgAirtableTable;
}
