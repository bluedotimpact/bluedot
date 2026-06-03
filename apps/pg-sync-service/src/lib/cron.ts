import cron from 'node-cron';
import { logger } from '@bluedot/ui/src/api';
import { initializeWebhooks, pollForUpdates, processUpdateQueue } from './pg-sync';
import { processAdminDashboardSyncRequests } from './admin-dashboard-sync';
import { recomputeComputedAirtableFields } from './computed-airtable-fields-sync';

const QUEUE_PROCESSING_INTERVAL_SECONDS = 5;
const ADMIN_SYNC_CHECK_INTERVAL_SECONDS = 10;
const COMPUTED_AIRTABLE_FIELDS_RECOMPUTE_SCHEDULE = '0 0 4 * * *'; // daily at 04:00

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
    await recomputeComputedAirtableFields();
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

export const startComputedAirtableFieldsCron = () => {
  logger.info('Starting computed Airtable fields cron job...');
  recomputeComputedAirtableFieldsCron();
};
