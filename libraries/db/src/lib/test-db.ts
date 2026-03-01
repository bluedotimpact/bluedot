import {
  type Table, getTableName, isTable, sql,
} from 'drizzle-orm';
// eslint-disable-next-line import/no-extraneous-dependencies
import { pushSchema } from 'drizzle-kit/api';
import { type PgAirtableDb } from './client';
import { PgAirtableTable } from './db-core';
import type { PgAirtableColumnInput, AirtableItemFromColumnsMap, BasePgTableType } from './typeUtils';
import * as schema from '../schema';

function collectPgTables() {
  return Object.fromEntries(Object.entries(schema)
    .filter(([, value]) => value instanceof PgAirtableTable || isTable(value))
    .map(([name, value]) => {
      if (value instanceof PgAirtableTable) {
        return [name, value.pg];
      }

      return [name, value];
    }));
}

export async function pushTestSchema(db: PgAirtableDb): Promise<void> {
  const pgTables = collectPgTables();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { apply } = await pushSchema(pgTables, db.pg as any);
  await apply();
}

/**
 * Truncates all tables in the test database. Designed to be called in a global beforeEach
 * so the database is isolated per-test
 */
export async function resetTestDb(db: PgAirtableDb): Promise<void> {
  const tableNames = Object.values(collectPgTables())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((table) => getTableName(table as Table<any>));

  if (tableNames.length === 0) return;

  const quoted = tableNames.map((n) => `"${n}"`).join(', ');
  await db.pg.execute(sql.raw(`TRUNCATE ${quoted} CASCADE`));
}

/**
 * Test-only variant of PgAirtableDb that allows passing an explicit `id` when inserting.
 */
export type TestPgAirtableDb = {
  insert<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    data: Partial<Omit<AirtableItemFromColumnsMap<TColumnsMap>, 'id'>> & { id?: string },
  ): Promise<BasePgTableType<TTableName, TColumnsMap>['$inferSelect']>;
} & Omit<PgAirtableDb, 'insert'>;
