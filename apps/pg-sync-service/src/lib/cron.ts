import cron from 'node-cron';
import { initializeWebhooks, pollForUpdates } from './pg-sync';

// Run the task every 30 seconds
// TODO change this to a setInterval
cron.schedule('* * * * * *', async () => {
  await pollForUpdates();
});

export const startCronJobs = () => {
  console.log('Starting cron jobs...');
  initializeWebhooks();
  pollForUpdates();
};
