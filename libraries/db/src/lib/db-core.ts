import { type Table } from 'airtable-ts';
import {
  pgTable,
  text,
  type PgColumnBuilderBase,
  type PgTable,
  type PgTableWithColumns,
} from 'drizzle-orm/pg-core';
import { type BuildColumns } from 'drizzle-orm/column-builder';
import {
  drizzleColumnToTsTypeString,
  type TsTypeString,
  type AllowedPgColumn,
  type PgAirtableColumnInput,
  type BasePgTableType,
  type AirtableItemFromColumnsMap,
  type PgAirtableConfig,
  type ExtractPgColumns,
} from './typeUtils';

/**
 * Shared shape for tables that own a Postgres definition and may carry deprecated
 * columns that are still present in the physical table but no longer written to.
 *
 * Both `PgAirtableTable` (Airtable-synced) and `SafePgTable` (Postgres-only)
 * satisfy this, letting pg-sync-service push `pgWithDeprecatedColumns ?? pg`
 * through a single code path.
 */
export type DeprecationSafeTable = {
  pg: PgTable;
  pgWithDeprecatedColumns?: PgTable;
};

export function isDeprecationSafeTable(value: unknown): value is DeprecationSafeTable {
  return value instanceof PgAirtableTable || value instanceof SafePgTable;
}

type SafePgColumnsMap = Record<string, PgColumnBuilderBase>;

type SafePgTablePg<
  TTableName extends string,
  TColumnsMap extends SafePgColumnsMap,
> = PgTableWithColumns<{
  name: TTableName;
  schema: undefined;
  columns: BuildColumns<TTableName, TColumnsMap, 'pg'>;
  dialect: 'pg';
}>;

export type SafePgTableConfig<
  TColumnsMap extends SafePgColumnsMap,
> = {
  columns: TColumnsMap;
  deprecatedColumns?: SafePgColumnsMap;
};

/**
 * A Postgres-only table (not synced from Airtable) that supports deprecating
 * columns the same way `pgAirtable` does: deprecated columns stay physically
 * present in the DB (via `pgWithDeprecatedColumns`) while application code reads
 * and writes through `pg` (active columns only). This lets a still-released
 * consumer keep SELECTing a column for the deploy window after it's dropped from
 * the active schema, instead of pg-sync-service dropping it immediately.
 */
export class SafePgTable<
  TTableName extends string = string,
  TColumnsMap extends SafePgColumnsMap = SafePgColumnsMap,
> implements DeprecationSafeTable {
  public readonly pg: SafePgTablePg<TTableName, TColumnsMap>;

  public readonly pgWithDeprecatedColumns?: DeprecationSafeTable['pg'];

  constructor(name: TTableName, config: SafePgTableConfig<TColumnsMap>) {
    this.pg = pgTable(name, config.columns) as SafePgTablePg<TTableName, TColumnsMap>;

    if (config.deprecatedColumns && Object.keys(config.deprecatedColumns).length > 0) {
      for (const [columnName, columnBuilder] of Object.entries(config.deprecatedColumns)) {
        // @ts-expect-error accessing internal config
        if (columnBuilder?.config?.notNull) {
          throw new Error(`Deprecated column "${columnName}" in table "${name}" must be nullable. `
            + 'Deprecated columns cannot use .notNull() because they stop receiving sync updates.');
        }

        if (columnName in config.columns) {
          throw new Error(`Column "${columnName}" in table "${name}" appears in both columns and deprecatedColumns. `
            + 'A column should only be in one or the other.');
        }
      }

      this.pgWithDeprecatedColumns = pgTable(name, {
        ...config.columns,
        ...config.deprecatedColumns,
      }) as unknown as DeprecationSafeTable['pg'];
    }
  }
}

export function safePgTable<
  TTableName extends string,
  TColumnsMap extends SafePgColumnsMap,
>(
  name: TTableName,
  config: SafePgTableConfig<TColumnsMap>,
): SafePgTable<TTableName, TColumnsMap> {
  return new SafePgTable(name, config);
}

export class PgAirtableTable<
  TTableName extends string = string,
  TColumnsMap extends Record<string, PgAirtableColumnInput> = Record<string, PgAirtableColumnInput>,
> implements DeprecationSafeTable {
  public readonly pg: BasePgTableType<TTableName, TColumnsMap>;

  public readonly pgWithDeprecatedColumns?: PgAirtableTable['pg'];

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
    // Initialise pgWithDeprecatedColumns if there are deprecated columns
    if (config.deprecatedColumns && Object.keys(config.deprecatedColumns).length > 0) {
      // Deprecated columns will stop being synced, validate they are nullable so we can handle this
      for (const [columnName, columnConfig] of Object.entries(config.deprecatedColumns)) {
        // @ts-expect-error accessing internal config
        if (columnConfig.pgColumn?.config?.notNull) {
          throw new Error(`Deprecated column "${columnName}" in table "${name}" must be nullable. `
            + 'Deprecated columns cannot use .notNull() because they won\'t receive Airtable sync updates.');
        }

        if (columnName in config.columns) {
          throw new Error(`Column "${columnName}" in table "${name}" appears in both columns and deprecatedColumns. `
            + 'A column should only be in one or the other.');
        }
      }

      const combinedColsBuilder: Record<string, AllowedPgColumn> = {
        id: text('id').primaryKey(),
      };

      for (const [columnName, columnConfig] of Object.entries(config.columns)) {
        combinedColsBuilder[columnName] = columnConfig.pgColumn;
      }

      for (const [columnName, columnConfig] of Object.entries(config.deprecatedColumns)) {
        combinedColsBuilder[columnName] = columnConfig.pgColumn;
      }

      this.pgWithDeprecatedColumns = pgTable(name, combinedColsBuilder) as unknown as typeof this.pgWithDeprecatedColumns;
    }

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

export function getPgAirtableFromIds({ baseId, tableId }: { baseId: string; tableId: string }): PgAirtableTable | undefined {
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
