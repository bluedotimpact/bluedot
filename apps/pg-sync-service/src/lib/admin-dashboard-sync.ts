import { logger } from '@bluedot/ui/src/api';
import {
  syncRequestsTable, eq, inArray, asc,
} from '@bluedot/db';
import { db } from './db';
import { syncManager } from './sync-manager';
import { performFullSync } from './scan';
import { addToQueue } from './pg-sync';

export async function processAdminDashboardSyncRequests(): Promise<void> {
  try {
    const queuedRequests = await db.pg.select()
      .from(syncRequestsTable)
      .where(eq(syncRequestsTable.status, 'queued'))
      .orderBy(asc(syncRequestsTable.requestedAt));

    if (!queuedRequests.length) {
      return;
    }

    const metadata = await syncManager.getSyncMetadata();
    if (metadata?.syncInProgress) {
      logger.info(`[admin-dashboard] Sync already in progress, keeping ${queuedRequests.length} requests queued until current sync completes`);
      return;
    }

    logger.info(`[admin-dashboard] Processing ${queuedRequests.length} queued admin dashboard sync requests`);

    const requestIds = queuedRequests.map((r) => r.id);
    const now = new Date();

    await db.pg.update(syncRequestsTable)
      .set({
        status: 'running',
        startedAt: now,
      })
      .where(inArray(syncRequestsTable.id, requestIds));

    try {
      await syncManager.markSyncStarted();

      await performFullSync(addToQueue);

      logger.info('[admin-dashboard] Sync items queued successfully, queue processor will handle them');

      await syncManager.markSyncCompleted();

      await setRequestsToCompleted(requestIds);

      logger.info(`[admin-dashboard] Successfully completed ${queuedRequests.length} admin dashboard sync requests`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await syncManager.markSyncFailed(errorMessage);

      await resetRequestsToQueued(requestIds);

      logger.error('[admin-dashboard] Failed to complete admin dashboard sync requests:', error);
    }
  } catch (error) {
    logger.error('[admin-dashboard] Error processing admin dashboard sync requests:', error);
  }
}

export async function setRequestsToCompleted(requestIds: number[]): Promise<void> {
  try {
    if (requestIds.length === 0) {
      logger.info('[admin-dashboard] No request IDs provided to complete');
      return;
    }

    await db.pg.update(syncRequestsTable)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(inArray(syncRequestsTable.id, requestIds));

    logger.info(`[admin-dashboard] Completed ${requestIds.length} admin dashboard sync requests: [${requestIds.join(', ')}]`);
  } catch (error) {
    logger.error('[admin-dashboard] Error completing admin dashboard requests:', error);
  }
}

export async function resetRequestsToQueued(requestIds: number[]): Promise<void> {
  try {
    if (requestIds.length === 0) {
      logger.info('[admin-dashboard] No request IDs provided for retry');
      return;
    }

    await db.pg.update(syncRequestsTable)
      .set({
        status: 'queued',
        startedAt: null,
      })
      .where(inArray(syncRequestsTable.id, requestIds));

    logger.info(`[admin-dashboard] Reset ${requestIds.length} admin dashboard sync requests for retry: [${requestIds.join(', ')}]`);
  } catch (error) {
    logger.error('[admin-dashboard] Error marking admin dashboard requests for retry:', error);
  }
}

export async function includeQueuedRequestsInCurrentSync(): Promise<number> {
  try {
    const queuedRequests = await db.pg.select()
      .from(syncRequestsTable)
      .where(eq(syncRequestsTable.status, 'queued'));

    if (queuedRequests.length === 0) {
      logger.info('[admin-dashboard] No queued requests to include in current sync');
      return 0;
    }

    const requestIds = queuedRequests.map((r) => r.id);
    const now = new Date();

    await db.pg.update(syncRequestsTable)
      .set({
        status: 'running',
        startedAt: now,
      })
      .where(inArray(syncRequestsTable.id, requestIds));

    logger.info(`[admin-dashboard] Included ${queuedRequests.length} queued requests in current sync: [${requestIds.join(', ')}]`);

    return queuedRequests.length;
  } catch (error) {
    logger.error('[admin-dashboard] Error including queued requests in current sync:', error);
    return 0;
  }
}

export async function completeAllRunningRequests(): Promise<number> {
  try {
    const runningRequests = await db.pg.select()
      .from(syncRequestsTable)
      .where(eq(syncRequestsTable.status, 'running'));

    if (runningRequests.length === 0) {
      logger.info('[admin-dashboard] No running admin dashboard requests to complete');
      return 0;
    }

    await db.pg.update(syncRequestsTable)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(syncRequestsTable.status, 'running'));

    const completedIds = runningRequests.map((r) => r.id);
    logger.info(`[admin-dashboard] Completed ${runningRequests.length} running admin dashboard requests: [${completedIds.join(', ')}]`);

    return runningRequests.length;
  } catch (error) {
    logger.error('[admin-dashboard] Error completing running admin dashboard requests:', error);
    return 0;
  }
}
