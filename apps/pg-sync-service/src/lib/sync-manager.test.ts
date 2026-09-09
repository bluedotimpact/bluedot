import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { syncMetadataTable } from '@bluedot/db';
import { db } from './db';
import { SyncManager } from './sync-manager';

vi.mock('@bluedot/utils/src/slackNotifications', () => ({
  slackAlert: vi.fn(),
}));

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);

// Guarantees a finish timestamp lands on a later millisecond than the start (a
// same-millisecond finish counts as still running)
const tick = () => new Promise((resolve) => {
  setTimeout(resolve, 2);
});

// Fresh instance per test so sync-ownership state can't leak between tests
let manager: SyncManager;
beforeEach(() => {
  manager = new SyncManager();
});

describe('SyncManager.markSyncInterruptedOnShutdown', () => {
  test('marks a sync this process started as interrupted', async () => {
    await manager.markSyncStarted();
    await tick();
    await manager.markSyncInterruptedOnShutdown();

    const metadata = await manager.getSyncMetadata();
    expect(metadata?.lastFullSyncStatus).toBe('interrupted');
    expect(metadata!.lastFullSyncFinishedAt! > metadata!.lastFullSyncStartedAt!).toBe(true);
  });

  test('does not touch a running sync this process did not start', async () => {
    // GIVEN another pod owns the running sync
    await manager.markSyncStarted();
    await tick();
    await manager.markSyncCompleted();
    const otherPodStartedAt = new Date();
    await db.pg.update(syncMetadataTable).set({
      lastFullSyncStartedAt: otherPodStartedAt,
      lastFullSyncFinishedAt: hoursAgo(1),
    });

    // WHEN a process that owns no sync shuts down
    await new SyncManager().markSyncInterruptedOnShutdown();

    // THEN the other pod's sync is untouched
    const metadata = await manager.getSyncMetadata();
    expect(metadata?.lastFullSyncStartedAt).toEqual(otherPodStartedAt);
    expect(metadata?.lastFullSyncStatus).toBe('success');
    expect(metadata!.lastFullSyncFinishedAt! < otherPodStartedAt).toBe(true);
  });
});
