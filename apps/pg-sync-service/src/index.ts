import { logger } from '@bluedot/ui/src/api';
import { getInstance } from './app';
import env from './env';
import { startCronJobs } from './lib/cron';
import { performFullSync } from './lib/scan';
import { addToQueue, waitForQueueToEmpty } from './lib/pg-sync';
import { syncManager } from './lib/sync-manager';
import { ensureSchemaUpToDate } from './lib/schema-sync';
import { completeAllPendingRequests } from './lib/admin-dashboard-sync';

const getInitialSyncTableNames = (args: string[]) => {
  const startIdx = args.indexOf('--initial-sync-tables');
  if (startIdx === -1) return [];

  const tableArgs: string[] = [];
  for (let i = startIdx + 1; i < args.length; i++) {
    const arg = args[i];
    if (arg && !arg.startsWith('--')) {
      tableArgs.push(arg);
    } else {
      break;
    }
  }

  return tableArgs;
};

const start = async () => {
  try {
    logger.info('Server starting...');

    const hasInitialSyncFlag = process.argv.includes('--initial-sync');
    const hasInitialSyncTablesFlag = process.argv.includes('--initial-sync-tables');

    if (hasInitialSyncFlag && hasInitialSyncTablesFlag) {
      throw new Error('Cannot use both --initial-sync and --initial-sync-tables flags together. Use either --initial-sync for all tables or --initial-sync-tables followed by specific table names.');
    }

    const initialSyncTableNames = hasInitialSyncTablesFlag ? getInitialSyncTableNames(process.argv) : undefined;

    if (initialSyncTableNames && initialSyncTableNames.length === 0) {
      throw new Error('Flag --initial-sync-tables requires at least one table name. Example: --initial-sync-tables course person user');
    }

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
    const needsFullSync = hasInitialSyncFlag || hasInitialSyncTablesFlag || schemaChangesDetected || await syncManager.isInitialSyncNeeded();

    if (needsFullSync) {
      if (hasInitialSyncFlag) {
        logger.info('[main] Starting full sync due to --initial-sync flag...');
      } else if (hasInitialSyncTablesFlag) {
        logger.info(`[main] Starting full sync of specific tables ([${initialSyncTableNames?.join(', ')}]) due to --initial-sync-tables flag...`);
      } else if (schemaChangesDetected) {
        logger.info('[main] Starting full sync due to schema changes...');
      } else {
        logger.info('[main] Starting full sync based on metadata check...');
      }

      try {
        await syncManager.markSyncStarted();
        await performFullSync(addToQueue, initialSyncTableNames);
        await waitForQueueToEmpty();
        await syncManager.markSyncCompleted();

        // Initial sync satisfies all pending sync requests
        const completedRequests = await completeAllPendingRequests();
        if (completedRequests > 0) {
          logger.info(`[main] Completed ${completedRequests} pending sync requests after initial sync`);
        }

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
