import cron from 'node-cron';
import { logger } from '@bluedot/ui/src/api';
import { initializeWebhooks, pollForUpdates, processUpdateQueue } from './pg-sync';

const POLLING_INTERVAL_SECONDS = 5;
let isProcessing = false;

const cronJob = async () => {
  if (isProcessing) {
    logger.info('[cron] Skipping execution - previous cycle still running');
    return;
  }

  isProcessing = true;
  try {
    await pollForUpdates();
    await processUpdateQueue();
  } catch (error) {
    logger.error('[cron] Error in processing cycle:', error);
  } finally {
    isProcessing = false;
  }
};

cron.schedule(`*/${POLLING_INTERVAL_SECONDS} * * * * *`, cronJob);

export const startCronJobs = () => {
  logger.info('Starting cron jobs...');
  initializeWebhooks();
  cronJob();
};
