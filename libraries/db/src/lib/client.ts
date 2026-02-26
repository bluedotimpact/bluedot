import {
  eq, and, or, gt, lt, gte, lte, ne, sql, type SQL, desc, asc,
} from 'drizzle-orm';
import { type PgInsertValue, type PgUpdateSetSource, type PgColumn } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { type drizzle as pgLiteDrizzle } from 'drizzle-orm/pglite';
import {
  AirtableTs, AirtableTsError, type AirtableTsOptions,
} from 'airtable-ts';
import { ErrorType } from 'airtable-ts/dist/AirtableTsError';
import { type PgAirtableTable } from './db-core';
import { type AirtableItemFromColumnsMap, type BasePgTableType, type PgAirtableColumnInput } from './typeUtils';
import env from './env';

/**
 * Base options interface for getFirst method
 */
export type GetFirstOptionsBase<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>> = {
  filter?: Filter<BasePgTableType<TTableName, TColumnsMap>['$inferSelect']>;
  limit?: number;
};

/**
 * Options for tables WITH autoNumberId (sortBy is optional)
 */
export type GetFirstOptionsWithAutoId<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>> =
  GetFirstOptionsBase<TTableName, TColumnsMap> & {
    sortBy?: {
      field: keyof BasePgTableType<TTableName, TColumnsMap>['$inferSelect'];
      direction?: 'asc' | 'desc';
    } | keyof BasePgTableType<TTableName, TColumnsMap>['$inferSelect'];
  };

/**
 * Options for tables WITHOUT autoNumberId (sortBy is REQUIRED)
 */
export type GetFirstOptionsWithoutAutoId<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>> =
  GetFirstOptionsBase<TTableName, TColumnsMap> & {
    /**
     * 🚨 **REQUIRED**: This table does not have `autoNumberId` for automatic sorting
     *
     * You must specify which field to sort by to ensure consistent ordering.
     *
     * @example
     * ```ts
     * // Using field name directly (defaults to 'asc')
     * sortBy: 'email'
     *
     * // Using object form for custom direction
     * sortBy: { field: 'createdAt', direction: 'desc' }
     * ```
     */
    sortBy: {
      field: keyof BasePgTableType<TTableName, TColumnsMap>['$inferSelect'];
      direction?: 'asc' | 'desc';
    } | keyof BasePgTableType<TTableName, TColumnsMap>['$inferSelect'];
  };

/**
 * Filter operations for querying records
 */
export type FilterOperation<T> = {
  [K in keyof T]?:
    | T[K]
    | { '>': T[K] }
    | { '<': T[K] }
    | { '>=': T[K] }
    | { '<=': T[K] }
    | { '=': T[K] }
    | { '!=': T[K] };
};

export type Filter<T> = FilterOperation<T> | {
  AND: Filter<T>[];
} | {
  OR: Filter<T>[];
};

export type PgDatabase = ReturnType<typeof drizzle> | ReturnType<typeof pgLiteDrizzle>;

/**
 * Postgres client which is identical to the standard client in terms of functionality, but
 * with deprecated write functions to warn developers not to use them directly.
 */
type RestrictedPgDatabase = Omit<PgDatabase, 'insert' | 'update' | 'delete'> & {
  /**
   * @deprecated Use `db.insert`, which will write to Airtable and mirror the result to Postgres.
   * Using this raw `db.pg.insert` function will only write to Postgres.
   */
  insert: PgDatabase['insert'];
  /**
   * @deprecated Use `db.update` instead, which will write to Airtable and mirror the result to Postgres.
   * Using this raw `db.pg.update` function will only write to Postgres.
   */
  update: PgDatabase['update'];
  /**
   * @deprecated Use `remove`, which will write to Airtable and mirror the result to Postgres.
   * Using this raw `db.pg.delete` function will only write to Postgres.
   */
  delete: PgDatabase['delete'];
};

export class PgAirtableDb {
  private pgUnrestricted: PgDatabase;

  public pg: RestrictedPgDatabase;

  /** @deprecated Never use this, unless you know what you're doing. Use the primary methods on PgAirtableDb instead */
  public airtableClient: AirtableTs;

  /** @deprecated Old name. Use .insert() instead */
  public airtableInsert = this.insert.bind(this);

  /** @deprecated Old name. Use .update() instead */
  public airtableUpdate = this.update.bind(this);

  /** @deprecated Old name. Use .remove() instead */
  public airtableDelete = this.remove.bind(this);

  constructor({
    pgConnString,
    airtableApiKey,
    onWarning,
    pgClient,
    airtableClient,
  }: {
    pgConnString: string;
    airtableApiKey: string;
    onWarning?: AirtableTsOptions['onWarning'];
    pgClient?: PgDatabase;
    airtableClient?: AirtableTs;
  }) {
    // In production, try to proceed on validation errors
    const readValidation = env.NODE_ENV === 'production' ? 'warning' : 'error';

    this.airtableClient = airtableClient ?? new AirtableTs({
      apiKey: airtableApiKey,
      readValidation,
      onWarning,
    });

    this.pgUnrestricted = pgClient ?? drizzle(pgConnString);
    this.pg = this.pgUnrestricted as RestrictedPgDatabase;
  }

  /**
   * Get exactly one record matching the filter. Throws error if 0 or >1 records match.
   */
  async get<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    idOrFilter: string | Filter<BasePgTableType<TTableName, TColumnsMap>['$inferSelect']>,
  ): Promise<BasePgTableType<TTableName, TColumnsMap>['$inferSelect']> {
    const results = await this.scan(
      table,
      typeof idOrFilter === 'string'
        ? { id: idOrFilter } as Filter<BasePgTableType<TTableName, TColumnsMap>['$inferSelect']>
        : idOrFilter,
    );

    if (results.length === 0) {
      throw new AirtableTsError({
        message: '[PgAirtableDb] No records found matching the filter',
        type: ErrorType.RESOURCE_NOT_FOUND,
        suggestion: 'Check the filter criteria or ensure the record exists.',
      });
    }

    if (results.length > 1) {
      throw new Error('Multiple records found: Filter must match exactly one record');
    }

    return results[0]!;
  }

  /**
   * Scan for records matching the optional filter. Returns all matching records.
   */
  async scan<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    filter?: Filter<BasePgTableType<TTableName, TColumnsMap>['$inferSelect']>,
  ): Promise<BasePgTableType<TTableName, TColumnsMap>['$inferSelect'][]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseQuery = this.pgUnrestricted.select().from(table.pg as any);

    if (filter) {
      const whereClause = this.buildWhereClause(table.pg, filter);
      return await baseQuery.where(whereClause) as BasePgTableType<TTableName, TColumnsMap>['$inferSelect'][];
    }

    return await baseQuery as BasePgTableType<TTableName, TColumnsMap>['$inferSelect'][];
  }

  /**
   * Get the first record matching the optional filter
   *
   * **For tables with autoNumberId:** Automatically sorts by autoNumberId DESC (newest first)
   * **For tables without autoNumberId:** Requires explicit sortBy field
   *
   * @example
   * ```ts
   * // For tables with autoNumberId - sortBy is optional
   * const result = await db.getFirst(tableWithAutoId, { filter: { active: true } });
   *
   * // For tables without autoNumberId - sortBy is required
   * const result = await db.getFirst(tableWithoutAutoId, {
   *   filter: { active: true },
   *   sortBy: 'createdAt' // This is required!
   * });
   * ```
   *
   * @param table The table to query
   * @param options Query options including filter, sortBy, and limit
   * @returns The first matching record or null if no records found
   */
  async getFirst<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    ...args: 'autoNumberId' extends keyof TColumnsMap
      ? [options?: GetFirstOptionsWithAutoId<TTableName, TColumnsMap>]
      : [options: GetFirstOptionsWithoutAutoId<TTableName, TColumnsMap>]
  ): Promise<BasePgTableType<TTableName, TColumnsMap>['$inferSelect'] | null> {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const options = args[0] || {};
    const {
      filter,
      sortBy,
      limit = 1,
    } = options;

    const sortConfig = this.resolveSortConfig(table, sortBy);

    if (!sortConfig) {
      const availableFields = Object.keys(table.pg).join(', ');
      throw new Error('Table does not have autoNumberId for default sorting. '
        + `Please specify a sortBy field. Available fields: ${availableFields}\n`);
    }

    // Build query with sorting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseQuery = this.pgUnrestricted.select().from(table.pg as any);

    // Apply sorting
    const fieldKey = sortConfig.field as string;
    const column = (table.pg as Record<string, PgColumn>)[fieldKey];
    if (!column) {
      throw new Error(`Field "${String(sortConfig.field)}" does not exist on table`);
    }

    // Build the final query with all clauses
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = baseQuery;

    if (filter) {
      query = query.where(this.buildWhereClause(table.pg, filter));
    }

    query = sortConfig.direction === 'desc'
      ? query.orderBy(desc(column))
      : query.orderBy(asc(column));

    // Apply limit and execute
    query = query.limit(limit);
    const results = await query as BasePgTableType<TTableName, TColumnsMap>['$inferSelect'][];

    return results.length > 0 ? results[0]! : null;
  }

  /**
   * Resolves sort configuration for getFirst, with intelligent defaults
   */
  private resolveSortConfig<
    TTableName extends string,
    TColumnsMap extends Record<string, PgAirtableColumnInput>,
  >(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    sortBy?: keyof BasePgTableType<TTableName, TColumnsMap>['$inferSelect'] | { field: keyof BasePgTableType<TTableName, TColumnsMap>['$inferSelect']; direction?: 'asc' | 'desc' },
  ): { field: keyof BasePgTableType<TTableName, TColumnsMap>['$inferSelect']; direction: 'asc' | 'desc' } | null {
    // If explicit sortBy provided, use it
    if (sortBy) {
      if (typeof sortBy === 'string' || typeof sortBy === 'symbol' || typeof sortBy === 'number') {
        const field = sortBy as keyof BasePgTableType<TTableName, TColumnsMap>['$inferSelect'];
        return {
          field,
          // Default to DESC for autoNumberId (newest first), ASC for others
          direction: field === 'autoNumberId' ? 'desc' : 'asc',
        };
      }

      return {
        field: sortBy.field,
        direction: sortBy.direction ?? (sortBy.field === 'autoNumberId' ? 'desc' : 'asc'),
      };
    }

    // Check for autoNumberId as default
    if ('autoNumberId' in table.pg) {
      return { field: 'autoNumberId', direction: 'desc' };
    }

    // No default available
    return null;
  }

  /**
   * Build a WHERE clause from a filter object
   */
  private buildWhereClause(
    table: Record<string, PgColumn>,
    filter: Filter<Record<string, unknown>>,
  ): SQL {
    if ('AND' in filter && Array.isArray(filter.AND)) {
      if (filter.AND.length === 0) {
        // Mathematically this should be TRUE (empty conjunction), but we return FALSE
        // defensively to avoid accidentally returning rows the caller doesn't have
        // permission to see. If a live code path needs empty AND to match everything,
        // change this to TRUE.
        return sql`FALSE`;
      }

      const conditions = filter.AND.map((f: Filter<Record<string, unknown>>) => this.buildWhereClause(table, f));
      const result = and(...conditions);
      if (!result) {
        throw new Error('Failed to build AND condition');
      }

      return result;
    }

    if ('OR' in filter && Array.isArray(filter.OR)) {
      if (filter.OR.length === 0) {
        return sql`FALSE`;
      }

      const conditions = filter.OR.map((f: Filter<Record<string, unknown>>) => this.buildWhereClause(table, f));
      const result = or(...conditions);
      if (!result) {
        throw new Error('Failed to build OR condition');
      }

      return result;
    }

    // Handle field-level filters
    const conditions: SQL[] = [];

    for (const [fieldName, fieldFilter] of Object.entries(filter)) {
      const column = table[fieldName];
      if (!column) {
        throw new Error(`Unknown field: ${fieldName}`);
      }

      if (fieldFilter && typeof fieldFilter === 'object' && !Array.isArray(fieldFilter)) {
        // Handle operation objects like { $gt: value }
        for (const [op, value] of Object.entries(fieldFilter)) {
          switch (op) {
            case '>':
              conditions.push(gt(column, value));
              break;
            case '<':
              conditions.push(lt(column, value));
              break;
            case '>=':
              conditions.push(gte(column, value));
              break;
            case '<=':
              conditions.push(lte(column, value));
              break;
            case '=':
              conditions.push(eq(column, value));
              break;
            case '!=':
              conditions.push(ne(column, value));
              break;
            default:
              throw new Error(`Unknown operation: ${op}`);
          }
        }
      } else {
        // Handle direct equality
        conditions.push(eq(column, fieldFilter));
      }
    }

    if (conditions.length === 0) {
      throw new Error('No valid filter conditions found');
    }

    const result = conditions.length === 1 ? conditions[0] : and(...conditions);
    if (!result) {
      throw new Error('Failed to build WHERE condition');
    }

    return result;
  }

  /**
   * Insert `data` into airtable and replicate synchronously to postgres (changes are readable immediately
   * after awaiting this).
   */
  async insert<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    data: Partial<Omit<AirtableItemFromColumnsMap<TColumnsMap>, 'id'>>,
  ): Promise<BasePgTableType<TTableName, TColumnsMap>['$inferSelect']> {
    const fullData = await this.airtableClient.insert(table.airtable, data);

    // `ensureReplicated` only returns undefined for idempotent deletes; upserts always return a result
    const pgResult = await this.ensureReplicated({ table, id: fullData.id, fullData });
    if (!pgResult) {
      throw new Error('Unexpected: `ensureReplicated` returned no result after insert');
    }

    return pgResult;
  }

  /**
   * Update the given record in airtable and replicate synchronously to postgres (changes are
   * readable immediately after awaiting this).
   */
  async update<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    data: Partial<AirtableItemFromColumnsMap<TColumnsMap>> & { id: string },
  ): Promise<BasePgTableType<TTableName, TColumnsMap>['$inferSelect']> {
    const fullData = await this.airtableClient.update(table.airtable, data);

    // `ensureReplicated` only returns undefined for idempotent deletes; upserts always return a result
    const pgResult = await this.ensureReplicated({ table, id: fullData.id, fullData });
    if (!pgResult) {
      throw new Error('Unexpected: `ensureReplicated` returned no result after update');
    }

    return pgResult;
  }

  /**
   * Delete the given record in airtable and replicate synchronously to postgres (changes are
   * readable immediately after awaiting this).
   */
  async remove<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    id: string,
  ): Promise<BasePgTableType<TTableName, TColumnsMap>['$inferSelect'] | undefined> {
    const { id: resultId } = await this.airtableClient.remove(table.airtable, id);

    const pgResult = await this.ensureReplicated({ table, id: resultId, isDelete: true });

    return pgResult;
  }

  /**
   * Ensures that a record from Airtable is replicated in the PostgreSQL database.
   * @param params.table - The PgAirtableTable instance defining the table schema and mappings
   * @param params.id - The Airtable record ID to replicate or delete
   * @param params.fullData - Optional Airtable record data. If provided, prevents an extra
   *   round trip to Airtable to fetch the data. Ignored when isDelete is true.
   * @param params.isDelete - Whether this is a delete operation. Defaults to false.
   *   Must be explicitly set to true for records to be deleted.
   */
  async ensureReplicated<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>({
    table, id, fullData, isDelete = false,
  }: {
    table: PgAirtableTable<TTableName, TColumnsMap>;
    id: string;
    /** Optional, if given prevents an extra round trip to airtable */
    fullData?: AirtableItemFromColumnsMap<TColumnsMap>;
    /** Must be passed explicitly for a record to be deleted. */
    isDelete?: boolean;
  }): Promise<BasePgTableType<TTableName, TColumnsMap>['$inferSelect'] | undefined> {
    return this.pgUnrestricted.transaction(async (tx) => {
      if (isDelete) {
        const deletedResults = await tx.delete(table.pg).where(eq(table.pg.id, id)).returning();
        const deletedResult = Array.isArray(deletedResults) ? deletedResults[0] : undefined;

        if (!deletedResult) {
          return undefined;
        }

        return deletedResult;
      }

      const data = fullData ?? await this.airtableClient.get(table.airtable, id);

      if (!data) {
        throw new Error('No data found for upsert operation');
      }

      // TODO For updates, check if there are changes with SELECT first to avoid acquiring a lock
      const rows = await tx.insert(table.pg).values(data as PgInsertValue<typeof table.pg>).onConflictDoUpdate({
        target: table.pg.id,
        set: data as PgUpdateSetSource<typeof table.pg>,
      }).returning();

      const result = Array.isArray(rows) ? rows[0] : undefined;

      if (!result) {
        throw new Error('Unexpected error: Nothing returned from upsert operation');
      }

      return result;
    });
  }
}
