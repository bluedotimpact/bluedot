import { Cron } from 'croner';
import { clearExpiredValues } from './cache';

const jobs: Cron[] = [];

export const startCronJobs = () => {
  jobs.push(Cron('*/5 * * * *', async () => {
    await clearExpiredValues();
  }));

  console.log(`Started ${jobs.length} cron job(s)`);
};

export const stopCronJobs = () => {
  jobs.forEach((j) => j.stop());
};
