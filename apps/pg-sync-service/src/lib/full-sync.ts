import * as Sentry from '@sentry/node';
import { logger } from '@bluedot/ui/src/api';
import { syncManager } from './sync-manager';
import { performFullSync } from './scan';
import { addToQueue, waitForQueueToEmpty } from './pg-sync';
import { syncRequestsTable } from '@bluedot/db';
import { db } from './db';
import {
  claimPendingRequests, pendingRequestsFilter, setRequestsToCompleted, setRequestsToFailed,
} from './admin-dashboard-sync';

const SYNC_FRESHNESS_THRESHOLD_HOURS = 24;

// A "running" sync older than this is presumed dead and a new full sync may start
export const FULL_SYNC_TIMEOUT_HOURS = 3;

/**
 * Whether the service should start a full sync right now, and why.
 */
export async function isFullSyncRequired({ trigger }: { trigger: 'boot' | 'cron' }): Promise<{ isRequired: boolean; reason: string }> {
  if (syncManager.shuttingDown) {
    return { isRequired: false, reason: 'shutdown in progress' };
  }

  const metadata = await syncManager.getSyncMetadata();

  // First ever run
  if (!metadata) {
    return { isRequired: true, reason: 'no sync metadata found' };
  }

  const { lastFullSyncStartedAt, lastFullSyncFinishedAt } = metadata;
  const isSyncRunning = lastFullSyncStartedAt !== null
    && (lastFullSyncFinishedAt === null || lastFullSyncFinishedAt <= lastFullSyncStartedAt);

  if (isSyncRunning) {
    // The sync has timed out (e.g. the pod running it hard-stopped without marking it finished)
    if (Date.now() - lastFullSyncStartedAt.getTime() > FULL_SYNC_TIMEOUT_HOURS * 60 * 60 * 1000) {
      return { isRequired: true, reason: `sync marked as running since ${lastFullSyncStartedAt.toISOString()} has exceeded the timeout of ${FULL_SYNC_TIMEOUT_HOURS}h and is presumed dead` };
    }

    // A sync is live (in this pod, or in the outgoing pod during a rollout): let it finish
    return { isRequired: false, reason: `a sync started at ${lastFullSyncStartedAt.toISOString()} is already running` };
  }

  // Requests (from the admin dashboard or boot) are waiting, or were orphaned as 'running' by a sync that died
  const pendingRequests = await db.pg.select().from(syncRequestsTable).where(pendingRequestsFilter);
  if (pendingRequests.length > 0) {
    return { isRequired: true, reason: `${pendingRequests.length} sync requests pending from: ${pendingRequests.map((r) => r.requestedBy).join(', ')}` };
  }

  // A rollout interrupted the last sync: retry as soon as possible
  if (metadata.lastFullSyncStatus === 'interrupted') {
    return { isRequired: true, reason: 'last full sync was interrupted' };
  }

  if (trigger === 'boot') {
    // Nothing has synced for a day, so webhook updates may have been missed while the service was down
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const lastSyncAt = metadata.lastIncrementalSyncAt || metadata.lastFullSyncFinishedAt;
    if (!lastSyncAt || Date.now() - lastSyncAt.getTime() > SYNC_FRESHNESS_THRESHOLD_HOURS * 60 * 60 * 1000) {
      return { isRequired: true, reason: `last sync was ${lastSyncAt?.toISOString()}, older than ${SYNC_FRESHNESS_THRESHOLD_HOURS}h threshold` };
    }

    return { isRequired: false, reason: `last sync was recent (${lastSyncAt.toISOString()})` };
  }

  return { isRequired: false, reason: 'no pending work' };
}

/**
 * Runs a full sync to completion, including any pending sync requests.
 * Never throws: a failure is recorded in the metadata and on the requests.
 */
export async function runFullSync(): Promise<void> {
  const requestIds = await claimPendingRequests();

  try {
    await syncManager.markSyncStarted();
    await performFullSync(addToQueue);

    logger.info('[full-sync] Sync items queued successfully, waiting for the queue to empty...');
    await waitForQueueToEmpty();

    await syncManager.markSyncCompleted();
    await setRequestsToCompleted(requestIds);

    logger.info('[full-sync] Full sync completed successfully');
  } catch (error) {
    Sentry.captureException(error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await syncManager.markSyncFailed(errorMessage);
    await setRequestsToFailed(requestIds);

    logger.error('[full-sync] Full sync failed:', error);
  }
}
