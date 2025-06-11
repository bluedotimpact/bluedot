/* eslint-disable no-console */
import { getInstance } from './app';
import env from './env';
import { startCronJobs } from './lib/cron';
import { performInitialSyncWithQueue } from './lib/scan';
import { addToQueue, rateLimiter } from './lib/pg-sync';

const start = async () => {
  try {
    console.log('Server starting...');
    
    // Check for --initial-sync flag
    const hasInitialSyncFlag = process.argv.includes('--initial-sync');
    
    const instance = await getInstance();
    await instance.listen({
      port: env.PORT ? parseInt(env.PORT) : 8080,
      host: '0.0.0.0',
    }).then((address) => {
      console.log(`Server listening on ${address}`);
    });

    // Start cron jobs (this includes the queue processing)
    startCronJobs();
    
    // If initial sync flag is present, start it in parallel
    if (hasInitialSyncFlag) {
      console.log('[main] Starting initial sync in parallel with normal operations...');
      
      // Run initial sync in the background (don't await)
      performInitialSyncWithQueue(addToQueue, rateLimiter)
        .then(() => {
          console.log('[main] Initial sync completed successfully');
        })
        .catch((error) => {
          console.error('[main] Initial sync failed:', error);
        });
    }
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
