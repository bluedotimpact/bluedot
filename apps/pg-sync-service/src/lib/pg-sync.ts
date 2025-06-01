import { eq, inArray, and, getPgAirtableFromIds, metaTable } from '@bluedot/db';
import { db } from './db';
import { AirtableAction, AirtableWebhook } from './webhook';

const updateQueue: AirtableAction[] = [];
const webhookInstances: Record<string, AirtableWebhook> = {};

/**
 * Initialize AirtableWebhook instances for each unique baseId in the meta table.
 */
export async function initializeWebhooks(): Promise<void> {
  const uniqueBaseIds = await db.pg
    .selectDistinct({ baseId: metaTable.airtableBaseId })
    .from(metaTable);

  for (const { baseId } of uniqueBaseIds) {
    // eslint-disable-next-line no-await-in-loop
    const webhook = await AirtableWebhook.getOrCreate(baseId);
    webhookInstances[baseId] = webhook;
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
 * Poll all webhooks for updates and add them to the update queue.
 */
export async function pollForUpdates(): Promise<void> {
  // Gather all updates from each webhook
  const webhooks = Object.values(webhookInstances);
  const allUpdates = (
    await Promise.all(webhooks.map((webhook) => webhook.popActions()))
  ).map(deduplicateActions);

  for (const updates of allUpdates) {
    console.log({ updates });
    updateQueue.push(...updates);
  }
}

/**
 * Process the update queue - stub for now.
 */
export async function processUpdateQueue(): Promise<void> {
  const failedUpdates: AirtableAction[] = [];

  let iteration = 0;
  while (updateQueue.length > 0) {
    iteration++;
    console.log(`[processUpdateQueue] Iteration ${iteration}, queue length: ${updateQueue.length}`);

    const update = updateQueue.shift();

    if (!update) {
      console.warn(`[processUpdateQueue] No update found at iteration ${iteration}, skipping.`);
      continue;
    }

    console.log(`[processUpdateQueue] Processing update:`, JSON.stringify(update, null, 2));

    try {
      // Log metaTable query parameters
      console.log(`[processUpdateQueue] Checking shouldSync for baseId=${update.baseId}, tableId=${update.tableId}, isDelete=${update.isDelete}, fieldIds=${JSON.stringify(update.fieldIds)}`);

      // eslint-disable-next-line no-await-in-loop
      const metaQuery = db.pg
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

      console.log(`[processUpdateQueue] About to execute metaTable query:`, {
        baseId: update.baseId,
        tableId: update.tableId,
        isDelete: update.isDelete,
        fieldIds: update.fieldIds,
      });

      // eslint-disable-next-line no-await-in-loop
      const metaResult = await metaQuery;
      console.log(`[processUpdateQueue] metaTable query result:`, metaResult);

      const shouldSync = metaResult.length > 0;
      console.log(`[processUpdateQueue] shouldSync: ${shouldSync}`);

      if (!shouldSync) {
        console.log(`[processUpdateQueue] Skipping update (shouldSync=false):`, JSON.stringify(update, null, 2));
        continue;
      }

      const pgAirtable = getPgAirtableFromIds({
        baseId: update.baseId,
        tableId: update.tableId,
      });

      if (!pgAirtable) {
        console.warn(`[processUpdateQueue] No pgAirtable found for baseId=${update.baseId}, tableId=${update.tableId}. Skipping update.`);
        continue;
      }

      console.log(`[processUpdateQueue] Found pgAirtable for baseId=${update.baseId}, tableId=${update.tableId}. Proceeding to replicate.`);

      // TODO decide what to do about this too
      // eslint-disable-next-line no-await-in-loop
      await db.ensureReplicated({
        table: pgAirtable,
        id: update.recordId,
        isDelete: update.isDelete,
      });

      console.log(`[processUpdateQueue] Successfully replicated recordId=${update.recordId} (isDelete=${update.isDelete}) for baseId=${update.baseId}, tableId=${update.tableId}`);
    } catch (err) {
      console.error(`[processUpdateQueue] Failed to process update:`, JSON.stringify(update, null, 2), err);
      failedUpdates.push(update);
    }
  }

  if (failedUpdates.length > 0) {
    console.error(`[processUpdateQueue] Failed updates encountered:`, JSON.stringify(failedUpdates, null, 2));
  } else {
    console.log(`[processUpdateQueue] All updates processed successfully.`);
  }
}
