import { Table } from 'airtable-ts';
import { BuildColumns } from 'drizzle-orm/column-builder';
import {
  pgTable,
  text,
  PgTableWithColumns,
} from 'drizzle-orm/pg-core';
import {
  drizzleColumnToTsTypeString,
  type TsTypeString,
  type DrizzleColumnToTsTypeString,
  type AllowedPgColumn,
} from './typeUtils';

export type PgAirtableColumnInput = {
  pgColumn: AllowedPgColumn;
  airtableId: string;
};

type PgAirtableConfig<TColumns extends Record<string, PgAirtableColumnInput>> = {
  baseId: string;
  tableId: string;
  columns: TColumns;
};

type ExtractPgColumns<T extends Record<string, PgAirtableColumnInput>> = {
  [K in keyof T]: K extends 'id' ? never : T[K]['pgColumn'];
} & {
  id: ReturnType<typeof text>;
};

// Use proper type-level mapping for each column type
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

export class PgAirtableTable<
  TTableName extends string,
  TColumnsMap extends Record<string, PgAirtableColumnInput>,
> {
  public readonly pg: Omit<BasePgTableType<TTableName, TColumnsMap>, 'id'> & PgTableWithColumns<{
    name: TTableName;
    schema: undefined;
    columns: BuildColumns<TTableName, { id: ReturnType<typeof text> }, 'pg'>;
    dialect: 'pg';
  }>;

  public readonly airtable: Table<AirtableItemFromColumnsMap<TColumnsMap>>;

  public readonly airtableFieldMap: ReadonlyMap<string, string>;

  private readonly tableName: TTableName;

  private readonly columnsConfig: TColumnsMap;

  constructor(name: TTableName, config: PgAirtableConfig<TColumnsMap>) {
    this.tableName = name;
    this.columnsConfig = config.columns;

    // Initialise Postgres
    const drizzleTableColsBuilder: Record<string, AllowedPgColumn> = {
      id: text('id').notNull().primaryKey(),
    };

    for (const [columnName, columnConfig] of Object.entries(config.columns)) {
      drizzleTableColsBuilder[columnName] = columnConfig.pgColumn;
    }

    // TODO what's going on with the type here
    const finalPgColumns: ExtractPgColumns<TColumnsMap> = drizzleTableColsBuilder as ExtractPgColumns<TColumnsMap>;

    this.pg = pgTable(name, finalPgColumns) as typeof this.pg;

    // Initialise Airtable
    const fieldMap = new Map<string, string>();
    for (const [columnName, columnConfig] of Object.entries(config.columns)) {
      fieldMap.set(columnName, columnConfig.airtableId);
    }

    // TODO can probably drop this variable
    this.airtableFieldMap = fieldMap;

    const mappings: Record<string, string> = {};
    const schema: Record<string, TsTypeString> = {};

    for (const [columnName, columnConfig] of Object.entries(this.columnsConfig)) {
      if (columnName !== 'id') {
        mappings[columnName] = columnConfig.airtableId;
        // Use correct type based on the drizzle column type
        schema[columnName] = drizzleColumnToTsTypeString(columnConfig.pgColumn);
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

// BEGIN Global registry
// TODO ideally remove this registry and fix the any types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pgAirtableTableRegistry: Record<string, PgAirtableTable<any, any>> = {};
function makePgAirtableKey(baseId: string, tableId: string): string {
  return `${baseId}:${tableId}`;
}

function registerPgAirtableTable<
  TTableName extends string,
  TColumnsMap extends Record<string, PgAirtableColumnInput>,
>({
  table,
  baseId,
  tableId,
}: {
  table: PgAirtableTable<TTableName, TColumnsMap>;
  baseId: string;
  tableId: string;
}): void {
  const key = makePgAirtableKey(baseId, tableId);
  pgAirtableTableRegistry[key] = table;
}

export function getPgAirtableFromIds(
  { baseId, tableId }: { baseId: string; tableId: string; },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): PgAirtableTable<any, any> | undefined {
  // console.log({ pgAirtableTableRegistry });
  const key = makePgAirtableKey(baseId, tableId);
  return pgAirtableTableRegistry[key];
}
// END Global registry

export function pgAirtable<
    TTableName extends string,
    TColumnsMap extends Record<string, PgAirtableColumnInput>,
>(
  name: TTableName,
  config: PgAirtableConfig<TColumnsMap>,
): PgAirtableTable<TTableName, TColumnsMap> {
  const result = new PgAirtableTable(name, config);

  registerPgAirtableTable({ table: result, baseId: config.baseId, tableId: config.tableId });

  return result;
}

export function isPgAirtableTable(table: unknown): table is PgAirtableTable<string, Record<string, PgAirtableColumnInput>> {
  return table instanceof PgAirtableTable;
}
