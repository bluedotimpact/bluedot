import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import {
  courseTable, getTableName, metaTable, syncMetadataTable, syncRequestsTable, unitTable,
} from '@bluedot/db';
import { db } from './db';
import { FULL_SYNC_TIMEOUT_HOURS, isFullSyncRequired, runFullSync } from './full-sync';
import { syncManager } from './sync-manager';
import { performFullSync } from './scan';
import { createSyncRequest } from './admin-dashboard-sync';
import { addToQueue, waitForQueueToEmpty } from './pg-sync';

vi.mock('./scan', () => ({
  performFullSync: vi.fn().mockResolvedValue({ failedTables: [] }),
  fetchAllRecordsFromAirtable: vi.fn().mockResolvedValue([]),
}));

vi.mock('./pg-sync', () => ({
  addToQueue: vi.fn(),
  waitForQueueToEmpty: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@bluedot/utils/src/slackNotifications', () => ({
  slackAlert: vi.fn(),
}));

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);

// Guarantees a finish timestamp lands on a later millisecond than the start (a
// same-millisecond finish counts as still running)
const tick = () => new Promise((resolve) => {
  setTimeout(resolve, 2);
});

const seedQueuedRequest = async () => {
  await db.pg.insert(syncRequestsTable).values({ requestedBy: 'test@bluedot.org' });
};

const seedCompletedSync = async () => {
  await syncManager.markSyncStarted();
  await tick();
  await syncManager.markSyncCompleted();
};

const seedFailedSync = async () => {
  await syncManager.markSyncStarted();
  await tick();
  await syncManager.markSyncFailed('something broke');
};

const seedInterruptedSync = async () => {
  await syncManager.markSyncStarted();
  await tick();
  await syncManager.markSyncInterruptedOnShutdown();
};

const getRequestStatuses = async () => {
  const requests = await db.pg.select().from(syncRequestsTable);
  return requests.map((r) => r.status);
};

const isRequired = async (check: Parameters<typeof isFullSyncRequired>[0]) => (await isFullSyncRequired(check)).isRequired;

beforeEach(() => {
  vi.clearAllMocks();
  syncManager.shuttingDown = false;
});

describe('isFullSyncRequired', () => {
  test('given no metadata, returns true', async () => {
    expect(await isRequired({ trigger: 'boot' })).toBe(true);
    expect(await isRequired({ trigger: 'cron' })).toBe(true);
  });

  test('given a recently completed sync, returns false', async () => {
    await seedCompletedSync();

    expect(await isRequired({ trigger: 'boot' })).toBe(false);
    expect(await isRequired({ trigger: 'cron' })).toBe(false);
  });

  test('given a sync started recently and never finished, returns false', async () => {
    await syncManager.markSyncStarted();

    expect(await isRequired({ trigger: 'boot' })).toBe(false);
    expect(await isRequired({ trigger: 'cron' })).toBe(false);
  });

  test('given a running sync that is not yet stale, returns false even with requests pending and a non-success last status', async () => {
    // GIVEN the last finished sync was interrupted, but another pod is now running a sync
    await seedInterruptedSync();
    await db.pg.update(syncMetadataTable.pg).set({
      lastFullSyncStartedAt: new Date(),
      lastFullSyncFinishedAt: hoursAgo(1),
    });
    await seedQueuedRequest();

    expect(await isRequired({ trigger: 'boot' })).toBe(false);
    expect(await isRequired({ trigger: 'cron' })).toBe(false);
  });

  test('given a sync that finished in the same millisecond it started, treats it as running', async () => {
    await seedCompletedSync();
    const now = new Date();
    await db.pg.update(syncMetadataTable.pg).set({
      lastFullSyncStartedAt: now,
      lastFullSyncFinishedAt: now,
    });

    expect(await isRequired({ trigger: 'cron' })).toBe(false);
  });

  test('given an old but finished sync, does not treat it as a stale running sync', async () => {
    await seedCompletedSync();
    await db.pg.update(syncMetadataTable.pg).set({
      lastFullSyncStartedAt: hoursAgo(48),
      lastFullSyncFinishedAt: hoursAgo(47),
    });

    expect(await isRequired({ trigger: 'cron' })).toBe(false);
  });

  test('given a stale running sync from a dead pod, returns true', async () => {
    await seedCompletedSync();
    await db.pg.update(syncMetadataTable.pg).set({
      lastFullSyncStartedAt: hoursAgo(FULL_SYNC_TIMEOUT_HOURS + 0.5),
      lastFullSyncFinishedAt: hoursAgo(FULL_SYNC_TIMEOUT_HOURS + 1),
      lastIncrementalSyncAt: new Date(),
    });

    expect(await isRequired({ trigger: 'boot' })).toBe(true);
    expect(await isRequired({ trigger: 'cron' })).toBe(true);
  });

  test('given a queued request, returns true', async () => {
    await seedCompletedSync();
    await seedQueuedRequest();

    expect(await isRequired({ trigger: 'boot' })).toBe(true);
    expect(await isRequired({ trigger: 'cron' })).toBe(true);
  });

  test('given a running request orphaned by a dead sync, returns true', async () => {
    await seedCompletedSync();
    await db.pg.insert(syncRequestsTable).values({ requestedBy: 'test@bluedot.org', status: 'running', startedAt: hoursAgo(5) });

    expect(await isRequired({ trigger: 'cron' })).toBe(true);
  });

  test('given the last sync was interrupted, returns true', async () => {
    await seedInterruptedSync();

    expect(await isRequired({ trigger: 'boot' })).toBe(true);
    expect(await isRequired({ trigger: 'cron' })).toBe(true);
  });

  test('given the last sync failed, does not retry it', async () => {
    await seedFailedSync();

    expect(await isRequired({ trigger: 'boot' })).toBe(false);
    expect(await isRequired({ trigger: 'cron' })).toBe(false);
  });

  test('given last sync older than 24h threshold, returns true at boot only', async () => {
    await seedCompletedSync();
    await db.pg.update(syncMetadataTable.pg).set({
      lastFullSyncStartedAt: hoursAgo(49),
      lastFullSyncFinishedAt: hoursAgo(48),
      lastIncrementalSyncAt: hoursAgo(48),
    });

    expect(await isRequired({ trigger: 'boot' })).toBe(true);
    expect(await isRequired({ trigger: 'cron' })).toBe(false);
  });

  test('given stale full sync but recent incremental sync, returns false', async () => {
    await seedCompletedSync();
    await db.pg.update(syncMetadataTable.pg).set({
      lastFullSyncStartedAt: hoursAgo(49),
      lastFullSyncFinishedAt: hoursAgo(48),
    });
    await syncManager.markIncrementalSync();

    expect(await isRequired({ trigger: 'boot' })).toBe(false);
  });

  test('given a request created by boot, returns true with its reason', async () => {
    await seedCompletedSync();
    await createSyncRequest('pg-sync-service (schema changes detected)');

    expect(await isFullSyncRequired({ trigger: 'boot' })).toEqual({ isRequired: true, reason: '1 sync requests pending from: pg-sync-service (schema changes detected)' });
  });

  test('returns the reason alongside the decision', async () => {
    await seedInterruptedSync();

    expect(await isFullSyncRequired({ trigger: 'cron' })).toEqual({ isRequired: true, reason: 'last full sync was interrupted' });
  });

  test('given shutdown has begun, returns false', async () => {
    await seedCompletedSync();
    await seedQueuedRequest();
    syncManager.shuttingDown = true;

    expect(await isRequired({ trigger: 'cron' })).toBe(false);
    expect(await getRequestStatuses()).toEqual(['queued']);
  });
});

describe('runFullSync', () => {
  test('completes the sync and the pending requests it claimed', async () => {
    await seedCompletedSync();
    await seedQueuedRequest();
    await db.pg.insert(syncRequestsTable).values({ requestedBy: 'test@bluedot.org', status: 'running', startedAt: hoursAgo(5) });

    await runFullSync();

    expect(vi.mocked(performFullSync)).toHaveBeenCalledTimes(1);
    expect(await getRequestStatuses()).toEqual(['completed', 'completed']);

    const metadata = await syncManager.getSyncMetadata();
    expect(metadata?.lastFullSyncStatus).toBe('success');
  });

  test('given the sync throws, marks the sync and its requests failed', async () => {
    await seedCompletedSync();
    await seedQueuedRequest();
    vi.mocked(performFullSync).mockRejectedValueOnce(new Error('airtable unavailable'));

    await runFullSync();

    expect(await getRequestStatuses()).toEqual(['failed']);

    const metadata = await syncManager.getSyncMetadata();
    expect(metadata?.lastFullSyncStatus).toBe('failed');
    expect(metadata?.lastFullSyncError).toContain('airtable unavailable');
  });

  describe('with the real scanner', () => {
    beforeEach(async () => {
      const actual = await vi.importActual<{ performFullSync: typeof performFullSync }>('./scan');
      vi.mocked(performFullSync).mockImplementationOnce(actual.performFullSync);

      await db.pg.insert(metaTable).values([courseTable, unitTable].map((table) => ({
        airtableBaseId: table.airtable.baseId,
        airtableTableId: table.airtable.tableId,
        airtableFieldId: 'testField',
        pgTable: getTableName(table.pg),
        pgField: 'title',
      })));
      await seedQueuedRequest();
    });

    test('marks the request completed when all tables scan successfully, including empty tables', async () => {
      const scan = vi.spyOn(db.airtableClient, 'scan').mockResolvedValue([]);

      try {
        await runFullSync();

        expect(scan).toHaveBeenCalledTimes(2);
        expect(await getRequestStatuses()).toEqual(['completed']);
        expect((await syncManager.getSyncMetadata())?.lastFullSyncStatus).toBe('success');
      } finally {
        scan.mockRestore();
      }
    });

    test.each([false, true])('marks exhausted table scans failed (all tables fail: %s)', async (allTablesFail) => {
      const scan = vi.spyOn(db.airtableClient, 'scan').mockImplementation(async (table) => {
        if (allTablesFail || table.tableId === courseTable.airtable.tableId) {
          throw new Error('airtable unavailable');
        }

        return [{ id: 'healthy-record', title: 'Healthy table' }];
      });

      try {
        await runFullSync();

        expect(scan).toHaveBeenCalledTimes(allTablesFail ? 6 : 4);
        expect(waitForQueueToEmpty).toHaveBeenCalledTimes(1);
        if (!allTablesFail) {
          expect(addToQueue).toHaveBeenCalledWith([expect.objectContaining({ recordId: 'healthy-record' })], 'low');
        }

        expect(await getRequestStatuses()).toEqual(['failed']);
        const metadata = await syncManager.getSyncMetadata();
        expect(metadata?.lastFullSyncStatus).toBe('failed');
        expect(metadata?.lastFullSyncError).toContain(courseTable.airtable.tableId);
        if (allTablesFail) {
          expect(metadata?.lastFullSyncError).toContain(unitTable.airtable.tableId);
        }

        expect(metadata?.lastIncrementalSyncAt).toBeNull();
      } finally {
        scan.mockRestore();
      }
    });
  });
});
