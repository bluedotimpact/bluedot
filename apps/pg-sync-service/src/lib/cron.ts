import cron from 'node-cron';
import { initializeWebhooks, pollForUpdates, processUpdateQueue } from './pg-sync';

const POLLING_INTERVAL_SECONDS = 5;
let isProcessing = false;

cron.schedule(`*/${POLLING_INTERVAL_SECONDS} * * * * *`, async () => {
  if (isProcessing) {
    console.log('[cron] Skipping execution - previous cycle still running');
    return;
  }
  
  isProcessing = true;
  try {
    await pollForUpdates();
    await processUpdateQueue();
  } catch (error) {
    console.error('[cron] Error in processing cycle:', error);
  } finally {
    isProcessing = false;
  }
});

export const startCronJobs = () => {
  console.log('Starting cron jobs...');
  initializeWebhooks();
  pollForUpdates();
};
