import {
  eq, getPgAirtableFromIds, metaTable, PgAirtableTable,
} from '@bluedot/db';
import { db } from './db';
import { AirtableAction } from './webhook';

/**
 * Simplified core function that uses scan() instead of manual pagination.
 * This should be much simpler and automatically handle data transformation.
 */
export async function processTableForInitialSync(
  baseId: string,
  tableId: string,
  fieldIds: string[],
  pgAirtable: PgAirtableTable<any, any>,
  addToQueue: (action: AirtableAction, priority: 'low' | 'high') => void,
): Promise<number> {
  const startTime = Date.now();

  // Set up heartbeat to show progress every 10 seconds
  let processedRecords = 0;
  let totalRecords = 0;
  const heartbeatInterval = setInterval(() => {
    if (totalRecords > 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const progress = Math.round((processedRecords / totalRecords) * 100);
      console.log(`[${tableId}] Heartbeat: ${processedRecords}/${totalRecords} records processed (${progress}%) - ${elapsed}s elapsed`);
    } else {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`[${tableId}] Heartbeat: Still scanning... ${elapsed}s elapsed`);
    }
  }, 10000); // 10 seconds

  try {
    // Scan all records from the table
    const records = await db.airtableClient.scan(pgAirtable.airtable);
    const duration = Date.now() - startTime;
    totalRecords = records.length;

    console.log(`Scanned ${records.length} records from ${tableId} in ${duration}ms`);

    // Process each record
    for (const [index, record] of records.entries()) {
      const action: AirtableAction = {
        baseId,
        tableId,
        recordId: record.id,
        isDelete: false,
        fieldIds, // Use all tracked field IDs for this table
        recordData: record as unknown as Record<string, unknown>, // Cast to expected type
      };

      addToQueue(action, 'low');
      processedRecords = index + 1;

      // Show progress for very large tables only
      if (records.length > 10000 && (index + 1) % 5000 === 0) {
        const progress = Math.round(((index + 1) / records.length) * 100);
        console.log(`Progress: ${index + 1}/${records.length} (${progress}%)`);
      }
    }

    console.log(`Queued ${records.length} records from ${tableId}`);
    return records.length;
  } catch (error) {
    console.error(`Error scanning ${tableId}:`, error);
    throw error;
  } finally {
    // Always clear the heartbeat interval
    clearInterval(heartbeatInterval);
  }
}

/**
 * Main function that performs initial sync by discovering tables and processing each one.
 * Now much simpler since we use scan() instead of manual pagination.
 */
export async function performInitialSync(
  addToQueue: (action: AirtableAction, priority: 'low' | 'high') => void,
): Promise<void> {
  console.log('🚀 Starting initial sync...');

  // 1. Discover all unique table combinations and their tracked fields
  const tableFieldMappings = await db.pg
    .select({
      baseId: metaTable.airtableBaseId,
      tableId: metaTable.airtableTableId,
      fieldId: metaTable.airtableFieldId,
    })
    .from(metaTable)
    .where(eq(metaTable.enabled, true));

  // Group field IDs by base+table combination
  const tableFieldMap: Record<string, string[]> = {};
  for (const { baseId, tableId, fieldId } of tableFieldMappings) {
    const key = `${baseId}::${tableId}`;
    if (!tableFieldMap[key]) {
      tableFieldMap[key] = [];
    }
    tableFieldMap[key].push(fieldId);
  }

  const tableKeys = Object.keys(tableFieldMap);

  // Prioritize the ExerciseResponse table (biggest table) to process it first
  const exerciseResponseKey = tableKeys.find((key) => key.includes('tblJR7vrlRs88mqdj'));
  const otherKeys = tableKeys.filter((key) => !key.includes('tblJR7vrlRs88mqdj'));
  const orderedTableKeys = exerciseResponseKey ? [exerciseResponseKey, ...otherKeys] : tableKeys;

  console.log(`Found ${tableKeys.length} tables to sync${exerciseResponseKey ? ' (prioritizing ExerciseResponse)' : ''}`);

  let totalRecords = 0;

  // 2. Process each table sequentially
  // eslint-disable-next-line no-await-in-loop -- Sequential processing is intentional for rate limiting
  for (const [index, tableKey] of orderedTableKeys.entries()) {
    const parts = tableKey.split('::');
    const baseId = parts[0];
    const tableId = parts[1];
    const fieldIds = tableFieldMap[tableKey];

    if (!baseId || !tableId || !fieldIds) {
      console.warn(`Invalid table key: ${tableKey}, skipping`);
      // eslint-disable-next-line no-continue -- Early continue is cleaner than nested if blocks
      continue;
    }

    console.log(`[${index + 1}/${orderedTableKeys.length}] Processing ${tableId}...`);

    const pgAirtable = getPgAirtableFromIds({ baseId, tableId });
    if (!pgAirtable) {
      console.warn(`No pgAirtable config found for ${tableId}, skipping`);
      // eslint-disable-next-line no-continue -- Early continue is cleaner than nested if blocks
      continue;
    }

    try {
      // eslint-disable-next-line no-await-in-loop -- Sequential processing is intentional for rate limiting
      const recordCount = await processTableForInitialSync(
        baseId,
        tableId,
        fieldIds,
        pgAirtable, // Pass the full pgAirtable object
        addToQueue,
      );
      totalRecords += recordCount;
    } catch (error) {
      console.error(`Error processing ${tableId}:`, error);
      // Continue with next table rather than failing entire sync
    }
  }

  console.log(`🎉 Initial sync completed! Total records queued: ${totalRecords}`);
}

/**
 * Wrapper function that integrates with the existing pg-sync queue system.
 */
export async function performInitialSyncWithQueue(
  addToQueueArray: (actions: AirtableAction[], priority: 'low' | 'high') => void,
): Promise<void> {
  // Create a wrapper that converts single actions to array format
  const addToQueueSingle = (action: AirtableAction, priority: 'low' | 'high') => {
    addToQueueArray([action], priority);
  };

  await performInitialSync(addToQueueSingle);
}
