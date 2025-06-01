// import { metaTable } from '@bluedot/db';
// import { db } from './db';
import { AirtableUpdateSummary as AirtableAction, AirtableWebhook } from './webhook';

const updateQueue: AirtableAction[] = [];
const webhookInstances: Record<string, AirtableWebhook> = {};

/**
 * Initialize AirtableWebhook instances for each unique baseId in the meta table.
 */
export async function initializeWebhooks(): Promise<void> {
  // TODO be able to import db package
  // const uniqueBaseIds = await db.pg
  //   .selectDistinct({ baseId: metaTable.airtableBaseId })
  //   .from(metaTable);
  const uniqueBaseIds = [{ baseId: 'apphq65a3uolNDNmi' }];

  for (const { baseId } of uniqueBaseIds) {
    // eslint-disable-next-line no-await-in-loop
    const webhook = await AirtableWebhook.create(baseId);
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
export function processUpdateQueue(): void {
  // TODO: Implement processing logic
  console.log(`Processing ${updateQueue.length} updates in queue`);
  updateQueue.length = 0; // Clear the queue
}
