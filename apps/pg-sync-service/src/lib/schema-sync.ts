import { logger } from '@bluedot/ui/src/api';
import {
  getTableName, metaTable, sql, PgAirtableTable,
  isTable,
  getTableColumns,
} from '@bluedot/db';
import * as schema from '@bluedot/db/src/schema';
import { pushSchema } from 'drizzle-kit/api';
import { db } from './db';

/**
 * Cleans up columns that exist in the database but are no longer in the schema definition.
 * This prevents migration hangs caused by simultaneous add/drop operations (e.g., column renames).
 */
async function cleanupRemovedColumns(pgTables: Record<string, PgAirtableTable['pg']>): Promise<void> {
  // Get current schema definition - what columns SHOULD exist
  const expectedColumns = new Map<string, Set<string>>();

  for (const [, table] of Object.entries(pgTables)) {
    const pgTableName = getTableName(table);
    expectedColumns.set(pgTableName, new Set());

    // Extract column names from the table definition
    for (const columnName of Object.values(getTableColumns(table)).map((col) => col.name)) {
      expectedColumns.get(pgTableName)!.add(columnName);
    }
  }

  // Query actual database columns and drop any that are no longer in schema
  for (const [tableName, expectedCols] of expectedColumns) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const actualColumns = await db.pg.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${tableName} 
        AND table_schema = 'public'
      `);

      const actualColNames = new Set(actualColumns.rows.map((row: Record<string, unknown>) => row.column_name as string));

      // Find columns that exist in DB but not in schema
      const columnsToRemove = [...actualColNames].filter((col) => !expectedCols.has(col));

      // Drop removed columns
      for (const columnName of columnsToRemove) {
        logger.info(`[schema-sync] Dropping removed column: ${tableName}.${columnName}`);
        // eslint-disable-next-line no-await-in-loop
        await db.pg.execute(sql`ALTER TABLE ${sql.identifier(tableName)} DROP COLUMN IF EXISTS ${sql.identifier(columnName)}`);
      }
    } catch (error) {
      // Probably a new table that doesn't exist yet
    }
  }
}

/**
 * Wraps pushSchema with a timeout to prevent hanging migrations
 */
async function pushSchemaWithTimeout(pgTables: Record<string, PgAirtableTable['pg']>): Promise<void> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(
        'Schema migration hung after 120 seconds. This is likely because you have made a change that breaks drizzle\'s pushSchema function. Also see https://github.com/drizzle-team/drizzle-orm/issues/4651.',
      ));
    }, 120_000);
  });

  const migrationPromise = (async () => {
    const result = await pushSchema(pgTables, db.pg);
    await result.apply();
  })();

  try {
    await Promise.race([migrationPromise, timeoutPromise]);
  } catch (error) {
    logger.error('[schema-sync] Migration failed or timed out:', error);
    process.exit(1);
  }
}

/**
 * Runs drizzle-kit push to sync schema changes to the database
 */
async function runDrizzlePush(): Promise<void> {
  try {
    logger.info('[schema-sync] Running schema push...');

    const pgTables = Object.fromEntries(Object.entries(schema)
      .filter(([, value]) => isTable(value) || 'pg' in value)
      .map(([name, value]) => ([name, (value instanceof PgAirtableTable ? value.pg : value) as unknown as PgAirtableTable['pg']])));
    logger.info(`[schema-sync] Pushing tables: ${Object.keys(pgTables).join(', ')}`);

    // Step 1: Clean up removed columns first to prevent migration hangs
    // These are usually caused by adding and removing columns at the same time,
    // which causes drizzle-kit to try to get stuck waiting for interactive input.
    // See https://github.com/drizzle-team/drizzle-orm/issues/4651
    await cleanupRemovedColumns(pgTables);

    // Step 2: Run Drizzle's pushSchema
    await pushSchemaWithTimeout(pgTables);

    logger.info('[schema-sync] ✅ Schema push completed successfully');
  } catch (error) {
    logger.error('[schema-sync] ❌ Schema push failed:', error);
    throw error;
  }
}

/**
 * Syncs field mappings between PostgreSQL tables and Airtable fields
 */
async function syncFields(): Promise<void> {
  try {
    logger.info('[schema-sync] Syncing field mappings...');

    const rowsToInsert: (typeof metaTable.$inferInsert)[] = [];

    for (const table of Object.values(schema)) {
      if (table instanceof PgAirtableTable) {
        const tableName = getTableName(table.pg);

        for (const [pgFieldName, airtableFieldId] of table.airtableFieldMap.entries()) {
          rowsToInsert.push({
            airtableBaseId: table.airtable.baseId,
            airtableTableId: table.airtable.tableId,
            airtableFieldId,
            pgTable: tableName,
            pgField: pgFieldName,
          });
        }
      }
    }

    if (rowsToInsert.length === 0) {
      logger.info('[schema-sync] No PgAirtableTable metadata found in schema to insert.');
      return;
    }

    logger.info(`[schema-sync] Preparing to insert ${rowsToInsert.length} rows into meta table...`);

    // Clear meta table
    logger.info('[schema-sync] Clearing meta table...');
    await db.pg.transaction(async (tx) => {
      await tx.delete(metaTable);

      // Insert new metadata
      logger.info('[schema-sync] Inserting new metadata...');
      const result = await tx.insert(metaTable).values(rowsToInsert).returning();
      logger.info(`[schema-sync] ✅ Successfully inserted ${result.length} rows into meta table.`);
    });
  } catch (error) {
    logger.error('[schema-sync] ❌ Field sync failed:', error);
    throw error;
  }
}

/**
 * Ensures the database schema is up to date by running validation, push, and field sync
 */
export async function ensureSchemaUpToDate(): Promise<void> {
  try {
    logger.info('[schema-sync] 🔄 Ensuring database schema is up to date...');

    // Step 1: Push schema changes to database
    await runDrizzlePush();

    // Step 2: Sync field mappings
    await syncFields();

    logger.info('[schema-sync] ✅ Database schema sync completed successfully');
  } catch (error) {
    logger.error('[schema-sync] ❌ Failed to update database schema:', error);
    throw error;
  }
}
