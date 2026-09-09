import { logger } from '@bluedot/ui/src/api';
import { syncRequestsTable, inArray } from '@bluedot/db';
import { db } from './db';

// 'running' requests are included because with no live sync they are orphans of a sync that died
export const pendingRequestsFilter = inArray(syncRequestsTable.status, ['queued', 'running']);

export async function claimPendingRequests(): Promise<number[]> {
  try {
    const pendingRequests = await db.pg.select()
      .from(syncRequestsTable)
      .where(pendingRequestsFilter);

    if (pendingRequests.length === 0) {
      logger.info('[admin-dashboard] No pending requests to include in current sync');
      return [];
    }

    const requestIds = pendingRequests.map((r) => r.id);
    const now = new Date();

    await db.pg.update(syncRequestsTable)
      .set({
        status: 'running',
        startedAt: now,
      })
      .where(inArray(syncRequestsTable.id, requestIds));

    logger.info(`[admin-dashboard] Included ${pendingRequests.length} pending requests in current sync: [${requestIds.join(', ')}]`);

    return requestIds;
  } catch (error) {
    logger.error('[admin-dashboard] Error including pending requests in current sync:', error);
    return [];
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

export async function setRequestsToFailed(requestIds: number[]): Promise<void> {
  try {
    if (requestIds.length === 0) {
      logger.info('[admin-dashboard] No request IDs provided to mark as failed');
      return;
    }

    await db.pg.update(syncRequestsTable)
      .set({ status: 'failed' })
      .where(inArray(syncRequestsTable.id, requestIds));

    logger.info(`[admin-dashboard] Marked ${requestIds.length} admin dashboard sync requests as failed: [${requestIds.join(', ')}]`);
  } catch (error) {
    logger.error('[admin-dashboard] Error marking admin dashboard requests as failed:', error);
  }
}
