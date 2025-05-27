import cron from 'node-cron';
import { initializeWebhooks, pollForUpdates } from './pg-sync';

// Run the task every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
  console.log('Running a task every 30 seconds');
  await pollForUpdates();
});

export const startCronJobs = () => {
  console.log('Starting cron jobs...');
  initializeWebhooks();
};
