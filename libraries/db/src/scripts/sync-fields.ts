/* eslint-disable no-console */
import { getTableName } from 'drizzle-orm';
import { PgAirtableTable } from '../lib/db-core';
import * as schema from '../schema';
import { metaTable } from '../schema';
import env from '../lib/env';
import { PgAirtableDb } from '../lib/client';

async function main() {
  const db = new PgAirtableDb({ pgConnString: env.PG_URL, airtableApiKey: env.AIRTABLE_PERSONAL_ACCESS_TOKEN });

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
    console.log('No PgAirtableTable metadata found in schema to insert.');
    return;
  }

  console.log(`Preparing to insert ${rowsToInsert.length} rows into meta table...`);
  console.log('Rows:', rowsToInsert);

  try {
    console.log('Clearing meta table...');
    await db.pg.delete(metaTable);

    console.log('Inserting new metadata...');
    const result = await db.pg.insert(metaTable).values(rowsToInsert).returning();

    console.log(`Successfully inserted ${result.length} rows into meta table.`);
  } catch (error) {
    console.error('Error updating meta table:', error);
    process.exit(1);
  }

  console.log('Metadata sync script finished.');

  process.exit(0);
}

if (require.main === module) {
  main();
} else {
  console.error('sync-fields script was imported, it should only be executed directly.');
}
