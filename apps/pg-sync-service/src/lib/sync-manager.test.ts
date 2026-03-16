import { describe, expect, test } from 'vitest';
import { syncMetadataTable } from '@bluedot/db';
import { db } from './db';
import { syncManager } from './sync-manager';

describe('syncManager.isInitialSyncNeeded', () => {
  test('given no metadata, returns true', async () => {
    expect(await syncManager.isInitialSyncNeeded()).toBe(true);
  });

  test('given sync started but never completed, returns true', async () => {
    // GIVEN sync was started (creates metadata row) but never completed
    await syncManager.markSyncStarted();

    // THEN initial sync is needed
    expect(await syncManager.isInitialSyncNeeded()).toBe(true);
  });

  test('given a recently completed sync, returns false', async () => {
    // GIVEN a full sync completed moments ago
    await syncManager.markSyncStarted();
    await syncManager.markSyncCompleted();

    // THEN initial sync is NOT needed
    expect(await syncManager.isInitialSyncNeeded()).toBe(false);
  });

  test('given last sync older than 24h threshold, returns true', async () => {
    // GIVEN a sync completed 48 hours ago
    await syncManager.markSyncStarted();
    await syncManager.markSyncCompleted();
    const old = new Date();
    old.setHours(old.getHours() - 48);
    await db.pg.update(syncMetadataTable).set({
      lastFullSyncAt: old,
      lastIncrementalSyncAt: old,
    });

    // THEN initial sync is needed
    expect(await syncManager.isInitialSyncNeeded()).toBe(true);
  });

  test('given stale full sync but recent incremental sync, returns false', async () => {
    // GIVEN full sync was 48h ago, but an incremental sync just happened
    await syncManager.markSyncStarted();
    await syncManager.markSyncCompleted();
    const old = new Date();
    old.setHours(old.getHours() - 48);
    await db.pg.update(syncMetadataTable).set({
      lastFullSyncAt: old,
    });
    await syncManager.markIncrementalSync();

    // THEN initial sync is NOT needed
    expect(await syncManager.isInitialSyncNeeded()).toBe(false);
  });
});
