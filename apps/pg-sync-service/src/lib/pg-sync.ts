import {
  eq, inArray, and, getPgAirtableFromIds, metaTable,
} from '@bluedot/db';
import { logger } from '@bluedot/ui/src/api';
import { db } from './db';
import { AirtableAction, AirtableWebhook } from './webhook';
import { RateLimiter } from './rate-limiter';

const MAX_RETRIES = 3;
const highPriorityQueue: AirtableAction[] = [];
const lowPriorityQueue: AirtableAction[] = [];
const rateLimiter = new RateLimiter(5);
const webhookInstances: Record<string, AirtableWebhook> = {};

const retryCountMap = new Map<string, number>();

function getRetryKey(update: AirtableAction): string {
  return `${update.baseId}::${update.tableId}::${update.recordId}`;
}

export function addToQueue(updates: AirtableAction[], priority: 'high' | 'low' = 'high'): void {
  const targetQueue = priority === 'high' ? highPriorityQueue : lowPriorityQueue;
  targetQueue.push(...updates);
}

export { rateLimiter };

/**
 * Initialize AirtableWebhook instances for each unique baseId in the meta table.
 */
export async function initializeWebhooks(): Promise<void> {
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
 * Poll all webhooks for updates and add them to the update queue.
 */
export async function pollForUpdates(): Promise<void> {
  // Gather all updates from each webhook
  const webhooks = Object.values(webhookInstances);
  const allUpdates: AirtableAction[][] = [];

  for (const webhook of webhooks) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const updates = await webhook.popActions();
      allUpdates.push(deduplicateActions(updates));
    } catch (err) {
      logger.error('[pollForUpdates] Failed to poll webhook:', err);
    }
  }

  for (const updates of allUpdates) {
    if (updates.length > 0) {
      logger.info(`[pollForUpdates] Adding ${updates.length} updates to queue`);
    }
    addToQueue(updates, 'high');
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
          ...(!update.isDelete
            ? [inArray(metaTable.airtableFieldId, update.fieldIds ?? [])]
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
        // TODO fix
        // @ts-expect-error
        fullData: update.recordData,
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
    return false;
  }
}

type UpdateProcessor = (update: AirtableAction) => Promise<boolean>;

export async function processUpdateQueue(processor: UpdateProcessor = processSingleUpdate): Promise<void> {
  let iteration = 0;
  let processedCount = 0;

  while (highPriorityQueue.length > 0 || lowPriorityQueue.length > 0) {
    iteration += 1;

    if (iteration % 100 === 1) {
      logger.info(`[processUpdateQueue] Iteration ${iteration}, high: ${highPriorityQueue.length}, low: ${lowPriorityQueue.length}`);
    }

    let update: AirtableAction | undefined;

    if (highPriorityQueue.length > 0) {
      update = highPriorityQueue.shift()!;
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
        logger.error(`[processUpdateQueue] Update failed after ${MAX_RETRIES} attempts, giving up: ${update.baseId}/${update.tableId}/${update.recordId}`);
        retryCountMap.delete(retryKey);
      }
    }
  }

  if (processedCount > 0) {
    logger.info(`[processUpdateQueue] Processing cycle completed. Processed ${processedCount} updates.`);
  }
}

export function getQueueStatus(): { high: number; low: number } {
  return {
    high: highPriorityQueue.length,
    low: lowPriorityQueue.length,
  };
}
