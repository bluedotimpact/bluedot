import { logger } from '@bluedot/ui/src/api';
import { syncMetadataTable, eq } from '@bluedot/db';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { db } from './db';
import env from '../env';

const DEFAULT_SYNC_THRESHOLD_HOURS = 24;

export type SyncMetadata = {
  id: string;
  lastFullSyncAt: Date | null;
  lastIncrementalSyncAt: Date | null;
  syncInProgress: boolean;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

class SyncManager {
  private syncThresholdHours: number;

  constructor(syncThresholdHours: number = DEFAULT_SYNC_THRESHOLD_HOURS) {
    this.syncThresholdHours = syncThresholdHours;
  }

  /**
   * Check if initial sync is needed based on metadata table
   */
  async isInitialSyncNeeded(): Promise<boolean> {
    try {
      const metadata = await this.getSyncMetadata();

      // If no metadata exists, initial sync is needed
      if (!metadata) {
        logger.info('[SyncManager] No sync metadata found, initial sync needed');
        return true;
      }

      // If no full sync has ever been completed, initial sync is needed
      if (!metadata.lastFullSyncAt) {
        logger.info('[SyncManager] No previous full sync found, initial sync needed');
        return true;
      }

      // Check if last full sync is older than threshold
      const thresholdTime = new Date();
      thresholdTime.setHours(thresholdTime.getHours() - this.syncThresholdHours);

      const lastSyncAt = metadata.lastIncrementalSyncAt || metadata.lastFullSyncAt;
      if (lastSyncAt < thresholdTime) {
        logger.info(`[SyncManager] Last sync was ${lastSyncAt}, older than threshold (${this.syncThresholdHours}h), initial sync needed`);
        if (metadata.syncInProgress) {
          logger.warn('[SyncManager] Sync is in progress but updatedAt is not recent, this may indicate a stuck sync. Will try to restart initial sync.');
        }
        return true;
      }

      logger.info(`[SyncManager] Last sync was recent (${lastSyncAt}), no initial sync needed`);
      return false;
    } catch (error) {
      logger.error('[SyncManager] Error checking sync metadata:', error);
      // If we can't check metadata, assume initial sync is needed for safety
      return true;
    }
  }

  /**
   * Get current sync metadata
   */
  async getSyncMetadata(): Promise<SyncMetadata | null> {
    try {
      const results = await db.pg.select().from(syncMetadataTable).where(eq(syncMetadataTable.id, 'singleton'));
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
        await db.pg.insert(syncMetadataTable).values({
          id: 'singleton',
          syncInProgress: false,
          lastSyncStatus: null,
          lastSyncError: null,
        });
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
      await db.pg.update(syncMetadataTable)
        .set({
          syncInProgress: true,
          lastSyncStatus: 'in_progress',
          lastSyncError: null,
          updatedAt: new Date(),
        })
        .where(eq(syncMetadataTable.id, 'singleton'));

      logger.info('[SyncManager] Marked sync as started');
      slackAlert(env, ['⌛ PG sync starting...'], { level: 'info' });
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
      await db.pg.update(syncMetadataTable)
        .set({
          syncInProgress: false,
          lastSyncStatus: 'success',
          lastSyncError: null,
          lastFullSyncAt: now,
          lastIncrementalSyncAt: now,
          updatedAt: now,
        })
        .where(eq(syncMetadataTable.id, 'singleton'));

      logger.info('[SyncManager] Marked sync as completed successfully');
      slackAlert(env, ['✅ PG sync completed successfully'], { level: 'info' });
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
      await db.pg.update(syncMetadataTable)
        .set({
          syncInProgress: false,
          lastSyncStatus: 'failed',
          lastSyncError: error,
          updatedAt: new Date(),
        })
        .where(eq(syncMetadataTable.id, 'singleton'));

      logger.error(`[SyncManager] Marked sync as failed: ${error}`);
      slackAlert(env, [`[SyncManager] Sync failed: ${error}`]);
    } catch (updateError) {
      logger.error('[SyncManager] Error marking sync as failed:', updateError);
      throw updateError;
    }
  }

  /**
   * Update incremental sync timestamp (for webhook-based updates)
   */
  async markIncrementalSync(): Promise<void> {
    try {
      await db.pg.update(syncMetadataTable)
        .set({
          lastIncrementalSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(syncMetadataTable.id, 'singleton'));
    } catch (error) {
      logger.error('[SyncManager] Error updating incremental sync timestamp:', error);
      // Don't throw here as this is not critical
    }
  }
}

export const syncManager = new SyncManager();
