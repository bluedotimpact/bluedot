/* eslint-disable no-console */
import { logger } from '@bluedot/ui/src/api';
import { getTableName, metaTable } from '@bluedot/db';
import * as schema from '@bluedot/db/src/schema';
import { PgAirtableTable } from '@bluedot/db/src/lib/db-core';
import { pushSchema } from 'drizzle-kit/api';
import { db } from './db';

/**
 * Runs drizzle-kit push to sync schema changes to the database
 */
async function runDrizzlePush(): Promise<void> {
  try {
    logger.info('[schema-sync] Running schema push...');

    await (await pushSchema(schema, db.pg)).apply();

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
