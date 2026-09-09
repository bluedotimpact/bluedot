// Must be first so Sentry is initialised before anything can throw
import './instrument';
import * as Sentry from '@sentry/node';
import { logger } from '@bluedot/ui/src/api';
import { slackAlert } from '@bluedot/utils';
import { getInstance } from './app';
import env from './env';
import { db } from './lib/db';
import { assertAirtableLiveness } from './lib/airtable-liveness';
import { startWebhooksAndProcessingUpdates, startAdminSyncCron } from './lib/cron';
import { syncManager } from './lib/sync-manager';
import { ensureSchemaUpToDate } from './lib/schema-sync';
import { isFullSyncRequired, runFullSync } from './lib/full-sync';

process.on('SIGTERM', () => {
  syncManager.shuttingDown = true;
  logger.info('Received SIGTERM, shutting down...');
  syncManager.markSyncInterruptedOnShutdown().finally(() => process.exit(0));
});

const start = async () => {
  try {
    logger.info('Server starting...');

    try {
      await assertAirtableLiveness(db.airtableClient);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Best-effort alert, but never let a stalled Slack request block the process
      // from failing fast: cap the wait so we always fall through to `throw` → exit.
      await Promise.race([
        slackAlert(env, [`pg-sync-service: Airtable liveness check failed on startup: ${message}`]),
        new Promise((resolve) => {
          setTimeout(resolve, 5000);
        }),
      ]).catch(() => {});
      throw error;
    }

    const hasInitialSyncFlag = process.argv.includes('--initial-sync');

    const schemaChangesDetected = await ensureSchemaUpToDate();

    const instance = await getInstance();
    await instance.listen({
      port: env.PORT ? parseInt(env.PORT) : 8080,
      host: '0.0.0.0',
    }).then((address) => {
      logger.info(`Server listening on ${address}`);
    });

    await startWebhooksAndProcessingUpdates();

    const { isRequired, reason } = await isFullSyncRequired({ trigger: 'boot', hasInitialSyncFlag, schemaChangesDetected });

    if (isRequired) {
      logger.info(`[main] Starting full sync: ${reason}`);
      await runFullSync();
    } else {
      logger.info(`[main] No full sync needed (${reason}), continuing with normal operations`);
    }

    // Start admin sync cron after any initial sync logic is complete
    startAdminSyncCron();
  } catch (error) {
    logger.error('Failed to start server', error);
    Sentry.captureException(error);
    await Sentry.flush(2000).catch(() => {});
    process.exit(1);
  }
};

start();
