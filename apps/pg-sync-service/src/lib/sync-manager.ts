import { logger } from '@bluedot/ui/src/api';
import { eq, syncMetadataTable, type SyncMetadata } from '@bluedot/db';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { db } from './db';
import env from '../env';

export class SyncManager {
  private isThisProcessRunningAFullSync = false;

  /** Set synchronously on SIGTERM so no new sync work is claimed during the grace period */
  shuttingDown = false;

  /**
   * Get current sync metadata
   */
  async getSyncMetadata(): Promise<SyncMetadata | null> {
    try {
      const results = await db.pg.select().from(syncMetadataTable.pg).where(eq(syncMetadataTable.pg.id, 'singleton'));
      return results.length > 0 ? results[0] as SyncMetadata : null;
    } catch (error) {
      logger.error('[SyncManager] Error fetching sync metadata:', error);
      return null;
    }
  }

  /**
   * Initialize sync metadata table if it doesn't exist
   */
  async initializeSyncMetadata(): Promise<void> {
    try {
      const existing = await this.getSyncMetadata();
      if (!existing) {
        await db.pg.insert(syncMetadataTable.pg).values({ id: 'singleton' });
        logger.info('[SyncManager] Initialized sync metadata table');
      }
    } catch (error) {
      logger.error('[SyncManager] Error initializing sync metadata:', error);
      throw error;
    }
  }

  /**
   * Mark sync as started
   */
  async markSyncStarted(): Promise<void> {
    try {
      await this.initializeSyncMetadata();
      await db.pg.update(syncMetadataTable.pg)
        .set({ lastFullSyncStartedAt: new Date() })
        .where(eq(syncMetadataTable.pg.id, 'singleton'));

      this.isThisProcessRunningAFullSync = true;
      logger.info('[SyncManager] Marked sync as started');
      slackAlert(env, ['⌛ PG sync starting...'], { channelId: env.PG_SYNC_SLACK_CHANNEL_ID });
    } catch (error) {
      logger.error('[SyncManager] Error marking sync as started:', error);
      throw error;
    }
  }

  /**
   * Mark sync as completed successfully
   */
  async markSyncCompleted(): Promise<void> {
    try {
      const now = new Date();
      await db.pg.update(syncMetadataTable.pg)
        .set({
          lastFullSyncFinishedAt: now,
          lastFullSyncStatus: 'success',
          lastFullSyncError: null,
          lastIncrementalSyncAt: now,
        })
        .where(eq(syncMetadataTable.pg.id, 'singleton'));

      this.isThisProcessRunningAFullSync = false;
      logger.info('[SyncManager] Marked sync as completed successfully');
      slackAlert(env, ['✅ PG sync completed successfully'], { channelId: env.PG_SYNC_SLACK_CHANNEL_ID });
    } catch (error) {
      logger.error('[SyncManager] Error marking sync as completed:', error);
      throw error;
    }
  }

  /**
   * Mark sync as failed
   */
  async markSyncFailed(error: string): Promise<void> {
    try {
      await db.pg.update(syncMetadataTable.pg)
        .set({
          lastFullSyncFinishedAt: new Date(),
          lastFullSyncStatus: 'failed',
          lastFullSyncError: error,
        })
        .where(eq(syncMetadataTable.pg.id, 'singleton'));

      this.isThisProcessRunningAFullSync = false;
      logger.error(`[SyncManager] Marked sync as failed: ${error}`);
      slackAlert(env, [`[SyncManager] Sync failed: ${error}`]);
    } catch (updateError) {
      logger.error('[SyncManager] Error marking sync as failed:', updateError);
      throw updateError;
    }
  }

  /**
   * Mark a sync as interrupted, only if this process started it (during a rollout the running sync may belong to the old pod)
   */
  async markSyncInterruptedOnShutdown(): Promise<void> {
    if (!this.isThisProcessRunningAFullSync) return;
    try {
      await db.pg.update(syncMetadataTable.pg)
        .set({
          lastFullSyncFinishedAt: new Date(),
          lastFullSyncStatus: 'interrupted',
          lastFullSyncError: 'Sync was interrupted by process shutdown (SIGTERM)',
        })
        .where(eq(syncMetadataTable.pg.id, 'singleton'));

      this.isThisProcessRunningAFullSync = false;
      logger.warn('[SyncManager] Marked in-progress sync as interrupted due to shutdown');
      slackAlert(env, ['[SyncManager] Sync interrupted by process shutdown (SIGTERM)'], { channelId: env.PG_SYNC_SLACK_CHANNEL_ID });
    } catch (error) {
      logger.error('[SyncManager] Error marking sync as interrupted on shutdown:', error);
    }
  }

  /**
   * Update incremental sync timestamp (for webhook-based updates)
   */
  async markIncrementalSync(): Promise<void> {
    try {
      await db.pg.update(syncMetadataTable.pg)
        .set({ lastIncrementalSyncAt: new Date() })
        .where(eq(syncMetadataTable.pg.id, 'singleton'));
    } catch (error) {
      logger.error('[SyncManager] Error updating incremental sync timestamp:', error);
      // Don't throw here as this is not critical
    }
  }
}

export const syncManager = new SyncManager();
