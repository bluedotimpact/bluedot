import { metaTable } from '@bluedot/db';
import { db } from './db';
import { AirtableUpdateSummary, AirtableWebhook } from './webhook';

const updateQueue: AirtableUpdateSummary[] = [];
const webhookInstances: Record<string, AirtableWebhook> = {};

/**
 * Initialize AirtableWebhook instances for each unique baseId in the meta table.
 */
export async function initializeWebhooks(): Promise<void> {
  const uniqueBaseIds = await db.pg
    .selectDistinct({ baseId: metaTable.airtableBaseId })
    .from(metaTable);

  for (const { baseId } of uniqueBaseIds) {
    const webhook = new AirtableWebhook(baseId);
    webhookInstances[baseId] = webhook;
  }
}

/**
 * Poll all webhooks for updates and add them to the update queue.
 */
export async function pollForUpdates(): Promise<void> {
  // Poll each webhook for updates
  for (const webhook of Object.values(webhookInstances)) {
    const updates = await webhook.popActions();
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
