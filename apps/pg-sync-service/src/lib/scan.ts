import {
  eq, and, getPgAirtableFromIds, inArray, metaTable, PgAirtableTable,
} from '@bluedot/db';
import { logger } from '@bluedot/ui/src/api';
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
    logger.info(`[${tableId}] Heartbeat: ${elapsed}s elapsed`);
  }, 10000);

  // TODO clean this up overall
  try {
    let records;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // eslint-disable-next-line no-await-in-loop
        records = await db.airtableClient.scan(pgAirtable.airtable);
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          logger.warn(`[${tableId}] Scan failed on attempt ${attempt}/${maxRetries}, retrying in ${retryDelay}ms:`, error);
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
      const errorDetails = {
        baseId,
        tableId,
        fieldIds,
        maxRetries,
        lastErrorType: lastError?.name || 'Unknown',
        lastErrorMessage: lastError?.message || 'No error details available',
      };
      throw new Error(`Failed to scan records after ${maxRetries} retries: ${JSON.stringify(errorDetails)}`);
    }

    const duration = Date.now() - startTime;
    logger.info(`Scanned ${records.length} records from ${tableId} in ${duration}ms`);

    for (const [index, record] of records.entries()) {
      const action: AirtableAction = {
        baseId,
        tableId,
        recordId: record.id,
        isDelete: false,
        fieldIds,
        recordData: record as { id: string } & Record<string, string | string[] | number | boolean | null>,
      };

      addToQueue(action, 'low');

      if (records.length > 10000 && (index + 1) % 5000 === 0) {
        const progress = Math.round(((index + 1) / records.length) * 100);
        logger.info(`Progress: ${index + 1}/${records.length} (${progress}%)`);
      }
    }

    logger.info(`Queued ${records.length} records from ${tableId}`);
    return records.length;
  } catch (error) {
    logger.error(`Error scanning ${tableId}:`, error);
    throw error;
  } finally {
    clearInterval(heartbeatInterval);
  }
}

/**
 * Performs full sync by discovering all tracked tables and processing each one.
 */
export async function performFullSync(
  addToQueue: (actions: AirtableAction[], priority: 'low' | 'high') => void,
  limitToTables?: string[],
): Promise<void> {
  logger.info('🚀 Starting full sync...');

  const tableFieldMappings = await db.pg
    .select({
      baseId: metaTable.airtableBaseId,
      tableId: metaTable.airtableTableId,
      fieldId: metaTable.airtableFieldId,
      pgTable: metaTable.pgTable,
    })
    .from(metaTable)
    .where(
      limitToTables
        ? and(
          eq(metaTable.enabled, true),
          inArray(metaTable.pgTable, limitToTables),
        )
        : eq(metaTable.enabled, true),
    );

  if (limitToTables) {
    const foundPgNames = new Set(tableFieldMappings.map((r) => r.pgTable));
    const missingPgNames = new Set(limitToTables.filter((x) => !foundPgNames.has(x)));

    if (missingPgNames.size) {
      logger.warn(`Failed to find some of the tables given by --initial-sync-tables: ${Array.from(missingPgNames).join(', ')}`);
    }
  }

  const tableFieldMap: Record<string, string[]> = {};
  for (const { baseId, tableId, fieldId } of tableFieldMappings) {
    const key = `${baseId}::${tableId}`;
    if (!tableFieldMap[key]) {
      tableFieldMap[key] = [];
    }
    tableFieldMap[key].push(fieldId);
  }

  const tableKeys = Object.keys(tableFieldMap);
  logger.info(`Found ${tableKeys.length} tables to sync`);

  let totalRecords = 0;

  const addToQueueSingle = (action: AirtableAction, priority: 'low' | 'high') => {
    addToQueue([action], priority);
  };

  for (const [index, tableKey] of tableKeys.entries()) {
    const parts = tableKey.split('::');
    const baseId = parts[0];
    const tableId = parts[1];
    const fieldIds = tableFieldMap[tableKey];

    if (!baseId || !tableId || !fieldIds) {
      logger.warn(`Invalid table key: ${tableKey}, skipping`);
      // eslint-disable-next-line no-continue -- Early continue is cleaner than nested if blocks
      continue;
    }

    logger.info(`[${index + 1}/${tableKeys.length}] Processing ${tableId}...`);

    const pgAirtable = getPgAirtableFromIds({ baseId, tableId });
    if (!pgAirtable) {
      logger.warn(`No pgAirtable config found for ${tableId}, skipping`);
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
      logger.error(`Error processing ${tableId}:`, error);
    }
  }

  logger.info(`🎉 Full sync completed! Total records queued: ${totalRecords}`);
}
