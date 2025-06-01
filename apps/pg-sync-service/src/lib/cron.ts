import cron from 'node-cron';
import { initializeWebhooks, pollForUpdates, processUpdateQueue } from './pg-sync';

const POLLING_INTERVAL_SECONDS = 5;

cron.schedule(`*/${POLLING_INTERVAL_SECONDS} * * * * *`, async () => {
  await pollForUpdates();
  await processUpdateQueue();
});

export const startCronJobs = () => {
  console.log('Starting cron jobs...');
  initializeWebhooks();
  pollForUpdates();
};
