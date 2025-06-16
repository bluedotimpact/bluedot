import { logger } from '@bluedot/ui/src/api';
import { getInstance } from './app';
import env from './env';
import { startCronJobs } from './lib/cron';
import { performInitialSync } from './lib/scan';
import { addToQueue } from './lib/pg-sync';
import { syncManager } from './lib/sync-manager';
import { ensureSchemaUpToDate } from './lib/schema-sync';

const start = async () => {
  try {
    logger.info('Server starting...');
    await ensureSchemaUpToDate();

    const instance = await getInstance();
    await instance.listen({
      port: env.PORT ? parseInt(env.PORT) : 8080,
      host: '0.0.0.0',
    }).then((address) => {
      logger.info(`Server listening on ${address}`);
    });

    startCronJobs();

    // Check if initial sync is needed (either via flag or automatic detection)
    const hasInitialSyncFlag = process.argv.includes('--initial-sync');
    const needsInitialSync = hasInitialSyncFlag || await syncManager.isInitialSyncNeeded();

    if (needsInitialSync) {
      if (hasInitialSyncFlag) {
        logger.info('[main] Starting initial sync due to --initial-sync flag...');
      } else {
        logger.info('[main] Starting automatic initial sync based on metadata check...');
      }

      try {
        await syncManager.markSyncStarted();
        await performInitialSync(addToQueue);
        await syncManager.markSyncCompleted();
        logger.info('[main] Initial sync completed successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await syncManager.markSyncFailed(errorMessage);
        logger.error('[main] Initial sync failed:', error);
      }
    } else {
      logger.info('[main] No initial sync needed, continuing with normal operations');
    }
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

start();
