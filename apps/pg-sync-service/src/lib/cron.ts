import cron from 'node-cron';
import { logger } from '@bluedot/ui/src/api';
import { getTableName } from '@bluedot/db';
import {
  computedAirtableFieldDefinitions,
  recomputeValues,
} from '@bluedot/computed-airtable-fields';
import {
  forwardEventTypeToPostHog, eventProjectionRules, type EventProjectionRule, type PosthogCredentials,
} from '@bluedot/computed-posthog-events';
import {
  initializeWebhooks, pollForUpdates, processUpdateQueue, rateLimiter,
} from './pg-sync';
import { processAdminDashboardSyncRequests } from './admin-dashboard-sync';
import { db } from './db';
import env from '../env';

const QUEUE_PROCESSING_INTERVAL_SECONDS = 5;
const ADMIN_SYNC_CHECK_INTERVAL_SECONDS = 10;
const COMPUTED_AIRTABLE_FIELDS_RECOMPUTE_SCHEDULE = '0 0 */2 * * *'; // every 2 hours
const POSTHOG_EVENTS_SCHEDULE = '0 */30 * * * *'; // every 30 minutes

let isProcessingQueue = false;
let isCheckingAdminSync = false;
let isRecomputingComputedAirtableFields = false;
let isShippingPosthogEvents = false;

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

const recomputeSingleField = async (definition: Parameters<typeof recomputeValues>[0]['definition']) => {
  const key = `${getTableName(definition.table.pg)}.${definition.field}`;
  try {
    const {
      checked, updated, failed, errors,
    } = await recomputeValues({
      db,
      definition,
      beforeWrite: () => rateLimiter.acquire(),
    });
    logger.info(`[computed-airtable-fields] ${key}: checked ${checked}, updated ${updated}, failed ${failed}`);

    if (failed > 0) {
      logger.error(`[computed-airtable-fields] ${key}: ${failed} failure(s); first error:`, errors[0]);
    }
  } catch (error) {
    logger.error(`[computed-airtable-fields] ${key} failed:`, error);
  }
};

export const recomputeComputedAirtableFieldsCron = async () => {
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
        await recomputeSingleField({ table, field, compute });
      }
    }
  } finally {
    isRecomputingComputedAirtableFields = false;
  }
};

const POSTHOG_EVENTS_LOOKBACK_MS = 24 * 60 * 60 * 1000; // re-scan the last 24h to cover brief downtime

const forwardSingleEventTypeToPostHog = async (eventProjectionRule: EventProjectionRule, posthogCredentials: PosthogCredentials, since: string) => {
  const { eventType: event } = eventProjectionRule;
  try {
    const {
      candidates, skipped, alreadySent, sent, failedBatches, errors,
    } = await forwardEventTypeToPostHog({
      db, posthogCredentials, eventProjectionRule, since, sourceVersion: env.VERSION_TAG,
    });

    logger.info(`[posthog-events] ${event}: ${sent} sent, ${alreadySent} already sent, ${skipped} skipped (of ${candidates})`);
    if (failedBatches > 0) {
      logger.error(`[posthog-events] ${event}: ${failedBatches} batch failure(s); first error:`, errors[0]);
    }
  } catch (error) {
    logger.error(`[posthog-events] ${event} failed:`, error);
  }
};

export const forwardAllEventsToPostHogCron = async () => {
  const apiKey = env.POSTHOG_PROJECT_API_KEY;
  if (!apiKey) {
    logger.info('[posthog-events] Skipping — POSTHOG_PROJECT_API_KEY not configured');
    return;
  }

  if (isShippingPosthogEvents) {
    logger.info('[posthog-events] Skipping execution - previous run still in progress');
    return;
  }

  isShippingPosthogEvents = true;
  try {
    const posthogCredentials: PosthogCredentials = {
      host: env.POSTHOG_HOST ?? 'https://eu.i.posthog.com',
      apiKey,
    };
    const since = new Date(Date.now() - POSTHOG_EVENTS_LOOKBACK_MS).toISOString();
    // Process each event type independently — one failing must not stop the others.
    for (const projection of eventProjectionRules) {
      // eslint-disable-next-line no-await-in-loop
      await forwardSingleEventTypeToPostHog(projection, posthogCredentials, since);
    }
  } finally {
    isShippingPosthogEvents = false;
  }
};

if (process.env.NODE_ENV !== 'test') {
  cron.schedule(`*/${QUEUE_PROCESSING_INTERVAL_SECONDS} * * * * *`, processQueueAndWebhooksCron);
  cron.schedule(`*/${ADMIN_SYNC_CHECK_INTERVAL_SECONDS} * * * * *`, checkAdminDashboardSyncRequestsCron);
  cron.schedule(COMPUTED_AIRTABLE_FIELDS_RECOMPUTE_SCHEDULE, recomputeComputedAirtableFieldsCron);
  cron.schedule(POSTHOG_EVENTS_SCHEDULE, forwardAllEventsToPostHogCron);
}

export const startWebhooksAndProcessingUpdates = async () => {
  logger.info('Starting webhooks and queue processing...');
  await initializeWebhooks();
  processQueueAndWebhooksCron();
};

export const startAdminSyncCron = () => {
  logger.info('Starting admin sync cron job...');
  checkAdminDashboardSyncRequestsCron();
};
