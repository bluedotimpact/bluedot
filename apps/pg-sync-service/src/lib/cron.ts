import cron from 'node-cron';
import { logger } from '@bluedot/ui/src/api';
import { getTableName } from '@bluedot/db';
import {
  computedAirtableFieldDefinitions,
  recomputeValues,
} from '@bluedot/computed-airtable-fields';
import {
  initializeWebhooks, pollForUpdates, processUpdateQueue, rateLimiter,
} from './pg-sync';
import { processAdminDashboardSyncRequests } from './admin-dashboard-sync';
import { db } from './db';

const QUEUE_PROCESSING_INTERVAL_SECONDS = 5;
const ADMIN_SYNC_CHECK_INTERVAL_SECONDS = 10;
const COMPUTED_AIRTABLE_FIELDS_RECOMPUTE_SCHEDULE = '0 0 */2 * * *'; // every 2 hours

let isProcessingQueue = false;
let isCheckingAdminSync = false;
let isRecomputingComputedAirtableFields = false;

const processQueueAndWebhooksCron = async () => {
  if (isProcessingQueue) {
    logger.info('[queue-processing] Skipping execution - previous queue processing still running');
    return;
  }

  isProcessingQueue = true;
  try {
    await pollForUpdates();
    await processUpdateQueue();
  } catch (error) {
    logger.error('[queue-processing] Error in queue processing cycle:', error);
  } finally {
    isProcessingQueue = false;
  }
};

const checkAdminDashboardSyncRequestsCron = async () => {
  if (isCheckingAdminSync) {
    logger.info('[admin-sync-check] Skipping execution - previous admin sync check still running');
    return;
  }

  isCheckingAdminSync = true;
  try {
    await processAdminDashboardSyncRequests();
  } catch (error) {
    logger.error('[admin-sync-check] Error checking admin sync requests:', error);
  } finally {
    isCheckingAdminSync = false;
  }
};

const recomputeComputedAirtableFieldsCron = async () => {
  if (isRecomputingComputedAirtableFields) {
    logger.info('[computed-airtable-fields] Skipping execution - previous recompute still running');
    return;
  }

  isRecomputingComputedAirtableFields = true;
  try {
    // Process fields sequentially. Airtable writes share the pg-sync-service rate limit budget.
    for (const { table, fields } of computedAirtableFieldDefinitions) {
      for (const [field, compute] of Object.entries(fields)) {
        // eslint-disable-next-line no-await-in-loop
        const { checked, updated, failed } = await recomputeValues({
          db,
          definition: { table, field, compute },
          beforeWrite: () => rateLimiter.acquire(),
        });
        logger.info(`[computed-airtable-fields] ${getTableName(table.pg)}.${field}: checked ${checked}, updated ${updated}, failed ${failed}`);
      }
    }
  } catch (error) {
    logger.error('[computed-airtable-fields] Error recomputing fields:', error);
  } finally {
    isRecomputingComputedAirtableFields = false;
  }
};

cron.schedule(`*/${QUEUE_PROCESSING_INTERVAL_SECONDS} * * * * *`, processQueueAndWebhooksCron);
cron.schedule(`*/${ADMIN_SYNC_CHECK_INTERVAL_SECONDS} * * * * *`, checkAdminDashboardSyncRequestsCron);
cron.schedule(COMPUTED_AIRTABLE_FIELDS_RECOMPUTE_SCHEDULE, recomputeComputedAirtableFieldsCron);

export const startWebhooksAndProcessingUpdates = async () => {
  logger.info('Starting webhooks and queue processing...');
  await initializeWebhooks();
  processQueueAndWebhooksCron();
};

export const startAdminSyncCron = () => {
  logger.info('Starting admin sync cron job...');
  checkAdminDashboardSyncRequestsCron();
};
