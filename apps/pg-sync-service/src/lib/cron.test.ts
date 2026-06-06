import {
  describe, expect, it, vi, beforeEach,
} from 'vitest';

const { mockRecomputeValues, mockDefinitions, mockLogger } = vi.hoisted(() => ({
  mockRecomputeValues: vi.fn(),
  mockDefinitions: [] as { table: { pg: object; _name?: string }; fields: Record<string, () => Promise<Record<string, unknown>>> }[],
  mockLogger: { info: vi.fn(), error: vi.fn() },
}));

vi.mock('@bluedot/ui/src/api', () => ({
  logger: mockLogger,
}));

vi.mock('@bluedot/computed-airtable-fields', () => ({
  recomputeValues: mockRecomputeValues,
  computedAirtableFieldDefinitions: mockDefinitions,
}));

vi.mock('@bluedot/db', () => ({
  // Surface a per-table name so error-logging assertions can distinguish tables.
  getTableName: (pg: { _name?: string }) => pg._name ?? 'fake_table',
}));

vi.mock('./pg-sync', () => ({
  rateLimiter: { acquire: vi.fn() },
  initializeWebhooks: vi.fn(),
  pollForUpdates: vi.fn(),
  processUpdateQueue: vi.fn(),
}));

vi.mock('./admin-dashboard-sync', () => ({
  processAdminDashboardSyncRequests: vi.fn(),
}));

vi.mock('./db', () => ({ db: {} }));

import { recomputeComputedAirtableFieldsCron } from './cron';

describe('recomputeComputedAirtableFieldsCron', () => {
  beforeEach(() => {
    mockRecomputeValues.mockReset();
    mockDefinitions.length = 0;
    mockLogger.info.mockReset();
    mockLogger.error.mockReset();
  });

  it('continues to remaining fields when one recomputeValues call throws', async () => {
    mockDefinitions.push({
      table: { pg: {} },
      fields: {
        fieldA: async () => ({}),
        fieldB: async () => ({}),
        fieldC: async () => ({}),
      },
    });

    mockRecomputeValues
      .mockRejectedValueOnce(new Error('boom on fieldA'))
      .mockResolvedValueOnce({ checked: 1, updated: 1, failed: 0 })
      .mockResolvedValueOnce({ checked: 2, updated: 0, failed: 0 });

    await recomputeComputedAirtableFieldsCron();

    expect(mockRecomputeValues).toHaveBeenCalledTimes(3);
  });

  it('continues to the next table when a field on the previous table throws', async () => {
    mockDefinitions.push(
      { table: { pg: {} }, fields: { onlyField: async () => ({}) } },
      { table: { pg: {} }, fields: { onlyField: async () => ({}) } },
    );

    mockRecomputeValues
      .mockRejectedValueOnce(new Error('table-1 blew up'))
      .mockResolvedValueOnce({ checked: 1, updated: 1, failed: 0 });

    await recomputeComputedAirtableFieldsCron();

    expect(mockRecomputeValues).toHaveBeenCalledTimes(2);
  });

  it('logs the failing table.field key when recomputeValues throws, so ops can grep alerts', async () => {
    mockDefinitions.push({
      table: { pg: { _name: 'exercise' }, _name: 'exercise' },
      fields: { computedNumResponses: async () => ({}) },
    });

    const err = new Error('compute exploded');
    mockRecomputeValues.mockRejectedValueOnce(err);

    await recomputeComputedAirtableFieldsCron();

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('exercise.computedNumResponses'),
      err,
    );
  });

  it('skips execution when a previous run is still in flight (reentry guard)', async () => {
    mockDefinitions.push({
      table: { pg: {} },
      fields: { onlyField: async () => ({}) },
    });

    // Make the first call hang so the second one fires while the guard is set.
    let release: (v: { checked: number; updated: number; failed: number }) => void = () => {};
    mockRecomputeValues.mockImplementationOnce(() => new Promise((resolve) => {
      release = resolve;
    }));

    const inFlight = recomputeComputedAirtableFieldsCron();
    // Yield once so the first call enters the loop and locks the flag.
    await Promise.resolve();

    await recomputeComputedAirtableFieldsCron();

    expect(mockRecomputeValues).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Skipping execution'));

    release({ checked: 0, updated: 0, failed: 0 });
    await inFlight;
  });

  it('releases the reentry guard after completion, so a subsequent invocation runs again', async () => {
    mockDefinitions.push({
      table: { pg: {} },
      fields: { onlyField: async () => ({}) },
    });

    // First run throws (verifies the finally still releases the flag despite errors);
    // second run should be allowed to start.
    mockRecomputeValues
      .mockRejectedValueOnce(new Error('first run blew up'))
      .mockResolvedValueOnce({ checked: 0, updated: 0, failed: 0 });

    await recomputeComputedAirtableFieldsCron();
    await recomputeComputedAirtableFieldsCron();

    expect(mockRecomputeValues).toHaveBeenCalledTimes(2);
  });
});
