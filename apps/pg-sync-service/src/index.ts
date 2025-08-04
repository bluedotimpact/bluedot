import { logger } from '@bluedot/ui/src/api';
import { getInstance } from './app';
import env from './env';
import { startCronJobs } from './lib/cron';
import { performFullSync } from './lib/scan';
import { addToQueue, waitForQueueToEmpty } from './lib/pg-sync';
import { syncManager } from './lib/sync-manager';
import { ensureSchemaUpToDate } from './lib/schema-sync';

const start = async () => {
  try {
    logger.info('Server starting...');
    const schemaChangesDetected = await ensureSchemaUpToDate();

    const instance = await getInstance();
    await instance.listen({
      port: env.PORT ? parseInt(env.PORT) : 8080,
      host: '0.0.0.0',
    }).then((address) => {
      logger.info(`Server listening on ${address}`);
    });

    await startCronJobs();

    // Check if initial sync is needed (either via flag, automatic detection, or schema changes)
    const hasInitialSyncFlag = process.argv.includes('--initial-sync');
    const needsFullSync = hasInitialSyncFlag || schemaChangesDetected || await syncManager.isInitialSyncNeeded();

    if (needsFullSync) {
      if (hasInitialSyncFlag) {
        logger.info('[main] Starting full sync due to --initial-sync flag...');
      } else if (schemaChangesDetected) {
        logger.info('[main] Starting full sync due to schema changes...');
      } else {
        logger.info('[main] Starting full sync based on metadata check...');
      }

      try {
        await syncManager.markSyncStarted();
        await performFullSync(addToQueue);
        await waitForQueueToEmpty();
        await syncManager.markSyncCompleted();
        logger.info('[main] Full sync completed successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await syncManager.markSyncFailed(errorMessage);
        logger.error('[main] Full sync failed:', error);
      }
    } else {
      logger.info('[main] No full sync needed, continuing with normal operations');
    }
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

start();
