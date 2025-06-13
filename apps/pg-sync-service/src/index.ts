import { logger } from '@bluedot/ui/src/api';
import { getInstance } from './app';
import env from './env';
import { startCronJobs } from './lib/cron';
import { performInitialSync } from './lib/scan';
import { addToQueue } from './lib/pg-sync';

const start = async () => {
  try {
    logger.info('Server starting...');

    const hasInitialSyncFlag = process.argv.includes('--initial-sync');

    const instance = await getInstance();
    await instance.listen({
      port: env.PORT ? parseInt(env.PORT) : 8080,
      host: '0.0.0.0',
    }).then((address) => {
      logger.info(`Server listening on ${address}`);
    });

    startCronJobs();

    if (hasInitialSyncFlag) {
      logger.info('[main] Starting initial sync in parallel with normal operations...');

      performInitialSync(addToQueue)
        .then(() => {
          logger.info('[main] Initial sync completed successfully');
        })
        .catch((error) => {
          logger.error('[main] Initial sync failed:', error);
        });
    }
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
