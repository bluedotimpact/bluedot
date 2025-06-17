import { Table } from 'airtable-ts';
import {
  pgTable,
  text,
} from 'drizzle-orm/pg-core';
import {
  drizzleColumnToTsTypeString,
  type TsTypeString,
  type AllowedPgColumn,
  PgAirtableColumnInput,
  BasePgTableType,
  AirtableItemFromColumnsMap,
  PgAirtableConfig,
  ExtractPgColumns,
} from './typeUtils';

export class PgAirtableTable<
  TTableName extends string = string,
  TColumnsMap extends Record<string, PgAirtableColumnInput> = Record<string, PgAirtableColumnInput>,
> {
  public readonly pg: BasePgTableType<TTableName, TColumnsMap>;

  public readonly airtable: Table<AirtableItemFromColumnsMap<TColumnsMap>>;

  public readonly airtableFieldMap: ReadonlyMap<string, string>;

  private readonly tableName: TTableName;

  private readonly columnsConfig: TColumnsMap;

  constructor(name: TTableName, config: PgAirtableConfig<TColumnsMap>) {
    this.tableName = name;
    this.columnsConfig = config.columns;

    // Initialise Postgres
    const drizzleTableColsBuilder: Record<string, AllowedPgColumn> = {
      id: text('id').primaryKey(),
    };

    for (const [columnName, columnConfig] of Object.entries(config.columns)) {
      drizzleTableColsBuilder[columnName] = columnConfig.pgColumn;
    }

    const finalPgColumns: ExtractPgColumns<TColumnsMap> = drizzleTableColsBuilder as ExtractPgColumns<TColumnsMap>;

    this.pg = pgTable(name, finalPgColumns) as typeof this.pg;

    // Initialise Airtable
    const fieldMap = new Map<string, string>();
    for (const [columnName, columnConfig] of Object.entries(config.columns)) {
      fieldMap.set(columnName, columnConfig.airtableId);
    }

    this.airtableFieldMap = fieldMap;

    const mappings: Record<string, string> = {};
    const schema: Record<string, TsTypeString> = {};

    for (const [columnName, columnConfig] of Object.entries(this.columnsConfig)) {
      if (columnName !== 'id') {
        mappings[columnName] = columnConfig.airtableId;
        schema[columnName] = drizzleColumnToTsTypeString(columnConfig.pgColumn);
      }
    }

    this.airtable = {
      name: this.tableName,
      baseId: config.baseId,
      tableId: config.tableId,
      // TODO avoid this casting
      mappings: mappings as Table<AirtableItemFromColumnsMap<TColumnsMap>>['mappings'],
      schema: schema as Table<AirtableItemFromColumnsMap<TColumnsMap>>['schema'],
    };
  }
}

const pgAirtableTableRegistry: Record<string, PgAirtableTable> = {};
function makePgAirtableKey(baseId: string, tableId: string): string {
  return `${baseId}:${tableId}`;
}

function registerPgAirtableTable({
  table,
  baseId,
  tableId,
}: {
  table: PgAirtableTable;
  baseId: string;
  tableId: string;
}): void {
  const key = makePgAirtableKey(baseId, tableId);
  if (pgAirtableTableRegistry[key]) {
    throw new Error(`Duplicate table key: ${key}`);
  }
  pgAirtableTableRegistry[key] = table;
}

export function getPgAirtableFromIds(
  { baseId, tableId }: { baseId: string; tableId: string; },
): PgAirtableTable<string, Record<string, PgAirtableColumnInput>> | undefined {
  const key = makePgAirtableKey(baseId, tableId);
  return pgAirtableTableRegistry[key];
}

export function pgAirtable<
    TTableName extends string,
    TColumnsMap extends Record<string, PgAirtableColumnInput>,
>(
  name: TTableName,
  config: PgAirtableConfig<TColumnsMap>,
): PgAirtableTable<TTableName, TColumnsMap> {
  const result = new PgAirtableTable(name, config);

  registerPgAirtableTable({ table: result as unknown as PgAirtableTable, baseId: config.baseId, tableId: config.tableId });

  return result;
}
