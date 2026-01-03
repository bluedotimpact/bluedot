import {
  eq, inArray, and, getPgAirtableFromIds, metaTable,
} from '@bluedot/db';
import { logger } from '@bluedot/ui/src/api';
import { AirtableItemFromColumnsMap, PgAirtableColumnInput } from '@bluedot/db/src/lib/typeUtils';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { db } from './db';
import { AirtableAction, AirtableWebhook } from './webhook';
import { RateLimiter } from './rate-limiter';
import { syncManager } from './sync-manager';
import { fetchAllRecordsFromAirtable } from './scan';
import env from '../env';

export const MAX_RETRIES = 3;
const BULK_FETCH_THRESHOLD = 100;
const highPriorityQueue: AirtableAction[] = [];
const lowPriorityQueue: AirtableAction[] = [];
const rateLimiter = new RateLimiter(5);
const webhookInstances: Record<string, AirtableWebhook> = {};

const retryCountMap = new Map<string, number>();
let queueEmptyCallback: (() => void) | null = null;

function getRetryKey(update: AirtableAction): string {
  return `${update.baseId}::${update.tableId}::${update.recordId}`;
}

export function addToQueue(updates: AirtableAction[], priority: 'high' | 'low' = 'high'): void {
  const targetQueue = priority === 'high' ? highPriorityQueue : lowPriorityQueue;
  targetQueue.push(...updates);
}

export { rateLimiter };

export async function waitForQueueToEmpty(): Promise<void> {
  // If queue already empty, return immediately
  if (highPriorityQueue.length === 0 && lowPriorityQueue.length === 0) {
    return Promise.resolve();
  }

  // Wait for queue to drain
  return new Promise((resolve) => {
    queueEmptyCallback = resolve;
  });
}

/**
 * Initialize AirtableWebhook instances for each unique baseId in the meta table.
 */
export async function initializeWebhooks(): Promise<void> {
  try {
  // Get all base IDs and their corresponding field IDs
    const baseFieldMappings = await db.pg
      .select({
        baseId: metaTable.airtableBaseId,
        fieldId: metaTable.airtableFieldId,
      })
      .from(metaTable)
      .where(eq(metaTable.enabled, true));

    // Group field IDs by base ID
    const fieldsByBase: Record<string, string[]> = {};
    for (const { baseId, fieldId } of baseFieldMappings) {
      if (!fieldsByBase[baseId]) {
        fieldsByBase[baseId] = [];
      }
      fieldsByBase[baseId].push(fieldId);
    }

    // Create webhooks for each base with their specific field filters
    const webhookPromises = Object.entries(fieldsByBase).map(([baseId, fieldIds]) => {
      logger.info(`[initializeWebhooks] Initializing webhook for base ${baseId} with ${fieldIds.length} field filters`);
      return AirtableWebhook.getOrCreate(baseId, fieldIds, rateLimiter).then((webhook) => {
        webhookInstances[baseId] = webhook;
      });
    });

    await Promise.all(webhookPromises);

    logger.info(`[initializeWebhooks] Initialized ${Object.keys(webhookInstances).length} webhooks with field-level filtering`);
  } catch (error) {
    const initError = `[initializeWebhooks] Critical webhook initialization failure: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(initError);
    slackAlert(env, [initError]);
    throw error;
  }
}

/**
 * Group actions down to the level of individual records:
 * - Take the union of any fieldIds affected
 * - Take `isDelete` to be true if if is true for any action
 */
export function deduplicateActions(updates: AirtableAction[]): AirtableAction[] {
  // Group by baseId, tableId, recordId
  const grouped: Record<string, AirtableAction> = {};

  for (const update of updates) {
    const key = `${update.baseId}::${update.tableId}::${update.recordId}`;
    if (!grouped[key]) {
      grouped[key] = { ...update, fieldIds: update.fieldIds ? [...update.fieldIds] : undefined };
    } else {
      // Union of fieldIds
      const prev = grouped[key];
      if (update.fieldIds) {
        if (!prev.fieldIds) {
          prev.fieldIds = [...update.fieldIds];
        } else {
          const set = new Set([...prev.fieldIds, ...update.fieldIds]);
          prev.fieldIds = Array.from(set);
        }
      }
      // OR of isDelete
      prev.isDelete = Boolean(prev.isDelete || update.isDelete);
    }
  }

  return Object.values(grouped);
}

/**
 * Groups webhook updates by which table they belong to
 */
function groupUpdatesByTable(
  updates: AirtableAction[],
): Record<string, AirtableAction[]> {
  const grouped: Record<string, AirtableAction[]> = {};
  for (const update of updates) {
    const tableKey = `${update.baseId}::${update.tableId}`;
    if (!grouped[tableKey]) grouped[tableKey] = [];
    grouped[tableKey].push(update);
  }
  return grouped;
}

/**
 * When we have many updates for a table, fetch ALL records from that table once
 * instead of making individual API calls for each record (which are rate-limited).
 * This attaches the full record data so processing is fast.
 */
async function attachRecordDataViaTableFetch(
  webhookUpdates: AirtableAction[],
): Promise<AirtableAction[]> {
  if (webhookUpdates.length === 0) {
    return webhookUpdates;
  }

  const firstUpdate = webhookUpdates[0];
  if (!firstUpdate) {
    return webhookUpdates;
  }

  const { baseId, tableId } = firstUpdate;

  // Check if this table is configured for sync before attempting bulk fetch
  const pgAirtable = getPgAirtableFromIds({ baseId, tableId });
  if (!pgAirtable) {
    logger.info(
      `[attachRecordDataViaTableFetch] Table ${baseId}/${tableId} not configured for sync, skipping bulk fetch`,
    );
    return webhookUpdates;
  }

  const deletes = webhookUpdates.filter((u) => u.isDelete);
  const nonDeletes = webhookUpdates.filter((u) => !u.isDelete);

  if (nonDeletes.length === 0) {
    logger.info(
      `[attachRecordDataViaTableFetch] All ${deletes.length} updates are deletes for ${baseId}/${tableId}, skipping table fetch`,
    );
    return deletes;
  }

  logger.info(
    `[attachRecordDataViaTableFetch] Processing ${nonDeletes.length} creates/updates and ${deletes.length} deletes for ${baseId}/${tableId}`,
  );

  try {
    const allRecords = await fetchAllRecordsFromAirtable(baseId, tableId);
    logger.info(
      `[attachRecordDataViaTableFetch] Fetched ${allRecords.length} records from ${baseId}/${tableId}`,
    );

    const recordsById = new Map(allRecords.map((r) => [r.id, r]));

    const actionsWithData: AirtableAction[] = [];
    let missingCount = 0;
    for (const update of nonDeletes) {
      const recordData = recordsById.get(update.recordId);
      if (recordData) {
        actionsWithData.push({
          baseId,
          tableId,
          recordId: update.recordId,
          fieldIds: update.fieldIds,
          isDelete: false,
          recordData,
        });
      } else {
        missingCount += 1;
        logger.warn(
          `[attachRecordDataViaTableFetch] Record ${update.recordId} not found in table fetch for ${baseId}/${tableId}`,
        );
      }
    }

    if (missingCount > 0) {
      logger.warn(
        `[attachRecordDataViaTableFetch] ${missingCount} of ${nonDeletes.length} records were missing from table fetch for ${baseId}/${tableId}`,
      );
    }

    return [...deletes, ...actionsWithData];
  } catch (error) {
    logger.error(
      `[attachRecordDataViaTableFetch] Failed for ${baseId}/${tableId}, `
      + 'falling back to normal processing:',
      error,
    );
    return webhookUpdates;
  }
}

/**
 * Poll all webhooks for updates and intelligently handles large batches
 */
export async function pollForUpdates(): Promise<void> {
  const webhooks = Object.values(webhookInstances);

  for (const webhook of webhooks) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const updates = await webhook.popActions();
      const dedupedUpdates = deduplicateActions(updates);

      // eslint-disable-next-line no-continue
      if (dedupedUpdates.length === 0) continue;

      // Group by table to detect large batches
      const updatesByTable = groupUpdatesByTable(dedupedUpdates);

      // Process each table's updates
      for (const [tableKey, tableUpdates] of Object.entries(updatesByTable)) {
        if (tableUpdates.length >= BULK_FETCH_THRESHOLD) {
          logger.info(
            `[pollForUpdates] Large batch detected: ${tableUpdates.length} updates for ${tableKey}, using bulk fetch optimization`,
          );
          // eslint-disable-next-line no-await-in-loop
          const updatesWithData = await attachRecordDataViaTableFetch(tableUpdates);
          logger.info(
            `[pollForUpdates] Bulk fetch completed: queued ${updatesWithData.length} actions for ${tableKey}`,
          );
          addToQueue(updatesWithData, 'high');
        } else {
          logger.info(
            `[pollForUpdates] Normal batch: ${tableUpdates.length} updates for ${tableKey}`,
          );
          addToQueue(tableUpdates, 'high');
        }
      }
    } catch (err) {
      logger.error('[pollForUpdates] Failed to poll webhook:', err);
    }
  }
}

async function processSingleUpdate(update: AirtableAction): Promise<boolean> {
  try {
    // For initial sync updates with recordData, skip rate limiting during processing
    // (rate limiting was already applied during the fetch phase)
    if (!update.recordData) {
      await rateLimiter.acquire();
    }

    const metaResult = await db.pg
      .select()
      .from(metaTable)
      .where(
        and(
          eq(metaTable.airtableBaseId, update.baseId),
          eq(metaTable.airtableTableId, update.tableId),
          // Only filter by fieldIds if they exist and are non-empty
          // Created records have no fieldIds, so we skip the filter to allow them through
          // If fieldIds is undefined/empty, we just check if the table is tracked at all
          ...(!update.isDelete && update.fieldIds && update.fieldIds.length > 0
            ? [inArray(metaTable.airtableFieldId, update.fieldIds)]
            : []),
        ),
      ).limit(1);

    if (metaResult.length === 0) {
      return true;
    }

    const pgAirtable = getPgAirtableFromIds({
      baseId: update.baseId,
      tableId: update.tableId,
    });

    if (!pgAirtable) {
      logger.warn(`[processSingleUpdate] No pgAirtable found for baseId=${update.baseId}, tableId=${update.tableId}. Skipping update.`);
      return true;
    }

    if (update.recordData) {
      // Fast path: use pre-fetched record data from initial sync
      await db.ensureReplicated({
        table: pgAirtable,
        fullData: update.recordData as AirtableItemFromColumnsMap<Record<string, PgAirtableColumnInput>>,
        id: update.recordId,
        isDelete: update.isDelete,
      });
    } else {
      // Standard path: fetch data via API (webhook updates)
      await db.ensureReplicated({
        table: pgAirtable,
        id: update.recordId,
        isDelete: update.isDelete,
      });
    }

    return true;
  } catch (err) {
    logger.error('Failed to process update:', `${update.baseId}/${update.tableId}/${update.recordId}`, err);
    // Don't alert, retry logic handles final failure alerts
    return false;
  }
}

type UpdateProcessor = (update: AirtableAction) => Promise<boolean>;

export async function processUpdateQueue(processor: UpdateProcessor = processSingleUpdate): Promise<void> {
  const startedWithWork = highPriorityQueue.length > 0 || lowPriorityQueue.length > 0;
  let iteration = 0;
  let processedCount = 0;

  while (highPriorityQueue.length > 0 || lowPriorityQueue.length > 0) {
    iteration += 1;

    if (iteration % 1000 === 1) {
      logger.info(`[processUpdateQueue] Iteration ${iteration}, high: ${highPriorityQueue.length}, low: ${lowPriorityQueue.length}`);
    }

    let update: AirtableAction | undefined;

    if (highPriorityQueue.length > 0) {
      update = highPriorityQueue.shift()!;
      // Log high priority updates (likely from webhooks)
      logger.info(`[processUpdateQueue] Processing HIGH priority update: base=${update.baseId}, table=${update.tableId}, record=${update.recordId}, isDelete=${update.isDelete}`);
    } else if (lowPriorityQueue.length > 0) {
      update = lowPriorityQueue.shift()!;
    }

    if (!update) break;

    // eslint-disable-next-line no-await-in-loop -- Sequential processing is intentional for rate limiting
    const success = await processor(update);
    if (success) {
      processedCount += 1;
      const retryKey = getRetryKey(update);
      retryCountMap.delete(retryKey);
    } else {
      const retryKey = getRetryKey(update);
      const currentRetries = retryCountMap.get(retryKey) || 0;

      if (currentRetries + 1 < MAX_RETRIES) {
        retryCountMap.set(retryKey, currentRetries + 1);
        logger.info(`[processUpdateQueue] Update failed (attempt ${currentRetries + 1}/${MAX_RETRIES}), retrying: ${update.baseId}/${update.tableId}/${update.recordId}`);
        addToQueue([update], 'low');
      } else {
        const finalFailure = `[processUpdateQueue] Update failed after ${MAX_RETRIES} attempts, giving up: ${update.baseId}/${update.tableId}/${update.recordId}`;
        logger.error(finalFailure);
        slackAlert(env, [finalFailure]);
        retryCountMap.delete(retryKey);
      }
    }
  }

  // After loop ends and queues are empty, notify callback if waiting
  if (highPriorityQueue.length === 0 && lowPriorityQueue.length === 0) {
    if (queueEmptyCallback) {
      queueEmptyCallback();
      queueEmptyCallback = null;
    }
  }

  // Only update timestamp if we actually processed something
  if (startedWithWork && processedCount > 0) {
    await syncManager.markIncrementalSync();
    logger.info(`[processUpdateQueue] Processing cycle completed. Processed ${processedCount} updates.`);
  }
}

export function getQueueStatus(): { high: number; low: number } {
  return {
    high: highPriorityQueue.length,
    low: lowPriorityQueue.length,
  };
}

/**
 * Clear all queues and retry counts - used for testing
 */
export function clearQueues(): void {
  highPriorityQueue.length = 0;
  lowPriorityQueue.length = 0;
  retryCountMap.clear();
}
