import {
  eq, and, or, gt, lt, gte, lte, ne, sql, desc, asc,
  type SQL,
} from 'drizzle-orm';
import { type PgColumn, type PgTable } from 'drizzle-orm/pg-core';
import { type drizzle } from 'drizzle-orm/node-postgres';
import { type drizzle as pgLiteDrizzle } from 'drizzle-orm/pglite';

export type PgDatabase = ReturnType<typeof drizzle> | ReturnType<typeof pgLiteDrizzle>;

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

export type GetFirstFromPgOptions<T extends PgTable> = {
  filter?: Filter<T['$inferSelect']>;
  sortBy?: keyof T['$inferSelect'] | { field: keyof T['$inferSelect']; direction?: 'asc' | 'desc' };
  limit?: number;
};

/**
 * Get the first record matching the optional filter from a plain drizzle pgTable.
 *
 * For tables with autoNumberId: defaults to sorting by autoNumberId DESC (newest first).
 * For tables without autoNumberId: sortBy must be provided, or this throws.
 */
export async function getFirstFromPg<T extends PgTable>(
  pgDb: PgDatabase,
  table: T,
  options: GetFirstFromPgOptions<T> = {},
): Promise<T['$inferSelect'] | null> {
  const { filter, sortBy, limit = 1 } = options;
  const columns = table as unknown as Record<string, PgColumn>;

  const sortConfig = resolveSortConfig(table, sortBy);
  if (!sortConfig) {
    const availableFields = Object.keys(columns).join(', ');
    throw new Error('Table does not have autoNumberId for default sorting. '
      + `Please specify a sortBy field. Available fields: ${availableFields}\n`);
  }

  const sortColumn = columns[sortConfig.field as string];
  if (!sortColumn) {
    throw new Error(`Field "${String(sortConfig.field)}" does not exist on table`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = pgDb.select().from(table as any).$dynamic();
  if (filter) {
    query = query.where(buildWhereClause(table, filter));
  }

  query = sortConfig.direction === 'desc' ? query.orderBy(desc(sortColumn)) : query.orderBy(asc(sortColumn));
  query = query.limit(limit);

  const results = await query as T['$inferSelect'][];
  return results.length > 0 ? results[0]! : null;
}

/**
 * Resolves sort configuration for getFirstFromPg, with intelligent defaults.
 */
export function resolveSortConfig<T extends PgTable>(
  table: T,
  sortBy?: keyof T['$inferSelect'] | { field: keyof T['$inferSelect']; direction?: 'asc' | 'desc' },
): { field: keyof T['$inferSelect']; direction: 'asc' | 'desc' } | null {
  if (sortBy) {
    if (typeof sortBy === 'string' || typeof sortBy === 'symbol' || typeof sortBy === 'number') {
      const field = sortBy as keyof T['$inferSelect'];
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

  if ('autoNumberId' in table) {
    return { field: 'autoNumberId' as keyof T['$inferSelect'], direction: 'desc' };
  }

  return null;
}

/**
 * Build a WHERE clause from a filter object.
 */
export function buildWhereClause<T extends PgTable>(
  table: T,
  filter: Filter<T['$inferSelect']>,
): SQL {
  const columns = table as unknown as Record<string, PgColumn>;
  return buildWhereClauseInner(columns, filter as Filter<Record<string, unknown>>);
}

function buildWhereClauseInner(
  columns: Record<string, PgColumn>,
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

    const conditions = filter.AND.map((f) => buildWhereClauseInner(columns, f));
    const result = and(...conditions);
    if (!result) throw new Error('Failed to build AND condition');
    return result;
  }

  if ('OR' in filter && Array.isArray(filter.OR)) {
    if (filter.OR.length === 0) return sql`FALSE`;

    const conditions = filter.OR.map((f) => buildWhereClauseInner(columns, f));
    const result = or(...conditions);
    if (!result) throw new Error('Failed to build OR condition');
    return result;
  }

  const conditions: SQL[] = [];

  for (const [fieldName, fieldFilter] of Object.entries(filter)) {
    const column = columns[fieldName];
    if (!column) throw new Error(`Unknown field: ${fieldName}`);

    if (fieldFilter && typeof fieldFilter === 'object' && !Array.isArray(fieldFilter)) {
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
      conditions.push(eq(column, fieldFilter));
    }
  }

  if (conditions.length === 0) throw new Error('No valid filter conditions found');

  const result = conditions.length === 1 ? conditions[0] : and(...conditions);
  if (!result) throw new Error('Failed to build WHERE condition');
  return result;
}
