import { config } from 'dotenv';

config({ path: '.env.local' });

async function main() {
  console.log('Starting metadata push script...');

  // Dynamically import the modules after setting the environment variables
  const { airtableTableMetadata, airtableColumnMetadata, metaTable } = await import('../db/schema');
  const { pg } = await import('../db');

  console.log('Collected Table Metadata:', airtableTableMetadata);
  console.log('Collected Column Metadata:', airtableColumnMetadata);

  const rowsToInsert: (typeof metaTable.$inferInsert)[] = [];

  for (const [tableName, tableMeta] of airtableTableMetadata.entries()) {
    const columnMetaMap = airtableColumnMetadata.get(tableName);
    if (!columnMetaMap) {
      console.warn(`No column metadata found for table: ${tableName}`);
      continue;
    }

    for (const [pgFieldName, airtableFieldId] of columnMetaMap.entries()) {
      rowsToInsert.push({
        airtableBaseId: tableMeta.baseId, // TODO maybe this should be more configurable
        airtableTableId: tableMeta.tableId,
        airtableFieldId,
        pgTable: tableName,
        pgField: pgFieldName,
      });
    }
  }

  if (rowsToInsert.length === 0) {
    console.log('No metadata found to insert.');
    return;
  }

  console.log(`Preparing to insert ${rowsToInsert.length} rows into meta table...`);
  console.log('Rows:', rowsToInsert);

  try {
    // Clear the table first to ensure fresh data
    console.log('Clearing meta table...');
    await pg.delete(metaTable);

    // Insert new metadata
    console.log('Inserting new metadata...');
    const result = await pg.insert(metaTable).values(rowsToInsert).returning();

    console.log(`Successfully inserted ${result.length} rows into meta table.`);
  } catch (error) {
    console.error('Error updating meta table:', error);
    process.exit(1); // Exit with error code
  }

  console.log('Metadata push script finished.');
  // Ensure the script exits after completion
  process.exit(0);
}

// Check if the script is being run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error in main execution:', error);
    process.exit(1);
  });
} else {
  // Optionally export functions or variables if it's meant to be importable
  console.log('Script imported, not executed directly.');
  // export { someFunction }; // Example export
}
