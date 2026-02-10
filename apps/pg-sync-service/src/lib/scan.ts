import {
  eq, and, getPgAirtableFromIds, inArray, metaTable, type PgAirtableTable,
} from '@bluedot/db';
import { logger } from '@bluedot/ui/src/api';
import { db } from './db';
import { type AirtableAction } from './webhook';

/**
 * Fetches ALL records from an Airtable table with retry logic
 */
export async function fetchAllRecordsFromAirtable(
  baseId: string,
  tableId: string,
) {
  const pgAirtable = getPgAirtableFromIds({ baseId, tableId });
  if (!pgAirtable) {
    throw new Error(`No pgAirtable config found for ${baseId}/${tableId}`);
  }

  const maxRetries = 3;
  const retryDelay = 1000;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await db.airtableClient.scan(pgAirtable.airtable) as ({ id: string } & Record<string, string | string[] | number | boolean | null>)[];
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        logger.warn(`[${tableId}] Fetch failed (attempt ${attempt}/${maxRetries}), retrying...`, error);
        // eslint-disable-next-line no-await-in-loop -- Intentional retry delay
        await new Promise((resolve) => {
          setTimeout(resolve, retryDelay);
        });
      }
    }
  }

  throw new Error(`Failed to fetch records after ${maxRetries} retries: ${lastError?.message}`);
}

/**
 * Converts Airtable records into AirtableActions with recordData pre-attached
 * @param filterToRecordIds - If provided, only includes these specific record IDs
 */
export function convertRecordsToActionsWithData(
  baseId: string,
  tableId: string,
  fieldIds: string[],
  airtableRecords: Awaited<ReturnType<typeof fetchAllRecordsFromAirtable>>,
  filterToRecordIds?: Set<string>,
) {
  const recordsToConvert = filterToRecordIds
    ? airtableRecords.filter((record) => filterToRecordIds.has(record.id))
    : airtableRecords;

  return recordsToConvert.map((record) => ({
    baseId,
    tableId,
    recordId: record.id,
    isDelete: false,
    fieldIds,
    recordData: record,
  }));
}

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

  const heartbeatInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    logger.info(`[${tableId}] Heartbeat: ${elapsed}s elapsed`);
  }, 10000);

  try {
    // Use extracted function
    const airtableRecords = await fetchAllRecordsFromAirtable(baseId, tableId);
    const duration = Date.now() - startTime;
    logger.info(`Fetched ${airtableRecords.length} records from ${tableId} in ${duration}ms`);

    // Use extracted function
    const actions = convertRecordsToActionsWithData(baseId, tableId, fieldIds, airtableRecords);

    // Queue all actions
    for (const [index, action] of actions.entries()) {
      addToQueue(action, 'low');

      if (airtableRecords.length > 10000 && (index + 1) % 5000 === 0) {
        const progress = Math.round(((index + 1) / airtableRecords.length) * 100);
        logger.info(`Progress: ${index + 1}/${airtableRecords.length} (${progress}%)`);
      }
    }

    logger.info(`Queued ${actions.length} records from ${tableId}`);
    return actions.length;
  } catch (error) {
    logger.error(`Error syncing table ${tableId}:`, error);
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
    .where(limitToTables
      ? and(
        eq(metaTable.enabled, true),
        inArray(metaTable.pgTable, limitToTables),
      )
      : eq(metaTable.enabled, true));

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
    tableFieldMap[key] ||= [];
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

      continue;
    }

    logger.info(`[${index + 1}/${tableKeys.length}] Processing ${tableId}...`);

    const pgAirtable = getPgAirtableFromIds({ baseId, tableId });
    if (!pgAirtable) {
      logger.warn(`No pgAirtable config found for ${tableId}, skipping`);

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
