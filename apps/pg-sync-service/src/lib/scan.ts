import {
  eq, getPgAirtableFromIds, metaTable, PgAirtableTable,
} from '@bluedot/db';
import { db } from './db';
import { AirtableAction } from './webhook';

/**
 * Core function that scans all records from a table and queues them for processing.
 */
export async function processTableForInitialSync(
  baseId: string,
  tableId: string,
  fieldIds: string[],
  pgAirtable: PgAirtableTable,
  addToQueue: (action: AirtableAction, priority: 'low' | 'high') => void,
): Promise<number> {
  const startTime = Date.now();
  const maxRetries = 3;
  const retryDelay = 1000;

  const heartbeatInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`[${tableId}] Heartbeat: ${elapsed}s elapsed`);
  }, 10000);

  // TODO clean this up overall
  try {
    let records;
    let lastError: Error | null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        records = await db.airtableClient.scan(pgAirtable.airtable);
        break;
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          console.warn(`[${tableId}] Scan failed on attempt ${attempt}/${maxRetries}, retrying in ${retryDelay}ms:`, error);
          // eslint-disable-next-line no-await-in-loop -- Intentional retry delay
          await new Promise((resolve) => {
            setTimeout(resolve, retryDelay);
          });
        } else {
          throw error;
        }
      }
    }

    if (!records) {
      throw new Error(lastError?.message || 'Failed to scan records after retries');
    }

    const duration = Date.now() - startTime;
    console.log(`Scanned ${records.length} records from ${tableId} in ${duration}ms`);

    for (const [index, record] of records.entries()) {
      const action: AirtableAction = {
        baseId,
        tableId,
        recordId: record.id,
        isDelete: false,
        fieldIds,
        recordData: record as unknown as Record<string, unknown>,
      };

      addToQueue(action, 'low');

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
    clearInterval(heartbeatInterval);
  }
}

/**
 * Performs initial sync by discovering all tracked tables and processing each one.
 */
export async function performInitialSync(
  addToQueue: (actions: AirtableAction[], priority: 'low' | 'high') => void,
): Promise<void> {
  console.log('🚀 Starting initial sync...');

  const tableFieldMappings = await db.pg
    .select({
      baseId: metaTable.airtableBaseId,
      tableId: metaTable.airtableTableId,
      fieldId: metaTable.airtableFieldId,
    })
    .from(metaTable)
    .where(eq(metaTable.enabled, true));

  const tableFieldMap: Record<string, string[]> = {};
  for (const { baseId, tableId, fieldId } of tableFieldMappings) {
    const key = `${baseId}::${tableId}`;
    if (!tableFieldMap[key]) {
      tableFieldMap[key] = [];
    }
    tableFieldMap[key].push(fieldId);
  }

  const tableKeys = Object.keys(tableFieldMap);
  console.log(`Found ${tableKeys.length} tables to sync`);

  let totalRecords = 0;

  const addToQueueSingle = (action: AirtableAction, priority: 'low' | 'high') => {
    addToQueue([action], priority);
  };

  // eslint-disable-next-line no-await-in-loop -- Sequential processing is intentional for rate limiting
  for (const [index, tableKey] of tableKeys.entries()) {
    const parts = tableKey.split('::');
    const baseId = parts[0];
    const tableId = parts[1];
    const fieldIds = tableFieldMap[tableKey];

    if (!baseId || !tableId || !fieldIds) {
      console.warn(`Invalid table key: ${tableKey}, skipping`);
      // eslint-disable-next-line no-continue -- Early continue is cleaner than nested if blocks
      continue;
    }

    console.log(`[${index + 1}/${tableKeys.length}] Processing ${tableId}...`);

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
        pgAirtable,
        addToQueueSingle,
      );
      totalRecords += recordCount;
    } catch (error) {
      console.error(`Error processing ${tableId}:`, error);
    }
  }

  console.log(`🎉 Initial sync completed! Total records queued: ${totalRecords}`);
}
