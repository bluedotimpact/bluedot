import {
  describe, expect, it, vi, beforeEach,
} from 'vitest';

const {
  mockRecomputeValues, mockDefinitions, mockLogger, mockForwardEvent, mockProjectionRules, mockEnv,
} = vi.hoisted(() => ({
  mockRecomputeValues: vi.fn(),
  mockDefinitions: [] as { table: { pg: object; _name?: string }; fields: Record<string, () => Promise<Record<string, unknown>>> }[],
  mockLogger: { info: vi.fn(), error: vi.fn() },
  mockForwardEvent: vi.fn(),
  mockProjectionRules: [] as { eventType: string }[],
  mockEnv: { POSTHOG_PROJECT_API_KEY: 'phc_test' } as { POSTHOG_PROJECT_API_KEY?: string; POSTHOG_HOST?: string },
}));

vi.mock('@bluedot/ui/src/api', () => ({
  logger: mockLogger,
}));

vi.mock('@bluedot/computed-airtable-fields', () => ({
  recomputeValues: mockRecomputeValues,
  computedAirtableFieldDefinitions: mockDefinitions,
}));

vi.mock('@bluedot/computed-posthog-events', () => ({
  forwardEventTypeToPostHog: mockForwardEvent,
  eventProjectionRules: mockProjectionRules,
}));

vi.mock('../env', () => ({ default: mockEnv }));

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

import { recomputeComputedAirtableFieldsCron, forwardAllEventsToPostHogCron } from './cron';

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

describe('forwardAllEventsToPostHogCron', () => {
  const emptyResult = {
    candidates: 0, skipped: 0, alreadySent: 0, sent: 0, failedBatches: 0, errors: [],
  };

  beforeEach(() => {
    mockForwardEvent.mockReset();
    mockForwardEvent.mockResolvedValue(emptyResult);
    mockProjectionRules.length = 0;
    mockLogger.info.mockReset();
    mockLogger.error.mockReset();
    mockEnv.POSTHOG_PROJECT_API_KEY = 'phc_test';
  });

  it('forwards nothing when POSTHOG_PROJECT_API_KEY is not configured', async () => {
    mockEnv.POSTHOG_PROJECT_API_KEY = undefined;
    mockProjectionRules.push({ eventType: 'application_submitted' });

    await forwardAllEventsToPostHogCron();

    expect(mockForwardEvent).not.toHaveBeenCalled();
  });

  it('continues to the remaining event types when one forward call throws', async () => {
    mockProjectionRules.push(
      { eventType: 'application_submitted' },
      { eventType: 'application_accepted' },
      { eventType: 'certificate_issued' },
    );
    mockForwardEvent.mockRejectedValueOnce(new Error('boom on application_submitted'));

    await forwardAllEventsToPostHogCron();

    expect(mockForwardEvent).toHaveBeenCalledTimes(3);
  });

  it('logs the failing eventType when a forward call throws, so ops can grep alerts', async () => {
    mockProjectionRules.push({ eventType: 'certificate_issued' });
    const err = new Error('forward exploded');
    mockForwardEvent.mockRejectedValueOnce(err);

    await forwardAllEventsToPostHogCron();

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('certificate_issued'),
      err,
    );
  });

  it('skips execution when a previous run is still in flight (reentry guard)', async () => {
    mockProjectionRules.push({ eventType: 'application_submitted' });

    // Make the first call hang so the second one fires while the guard is set.
    let release: (v: typeof emptyResult) => void = () => {};
    mockForwardEvent.mockImplementationOnce(() => new Promise((resolve) => {
      release = resolve;
    }));

    const inFlight = forwardAllEventsToPostHogCron();
    // Yield once so the first call enters the loop and locks the flag.
    await Promise.resolve();

    await forwardAllEventsToPostHogCron();

    expect(mockForwardEvent).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Skipping execution'));

    release(emptyResult);
    await inFlight;
  });

  it('releases the reentry guard after completion, so a subsequent invocation runs again', async () => {
    mockProjectionRules.push({ eventType: 'application_submitted' });

    // First run hits an error (verifies the finally still releases the flag); second run should run.
    mockForwardEvent.mockRejectedValueOnce(new Error('first run blew up'));

    await forwardAllEventsToPostHogCron();
    await forwardAllEventsToPostHogCron();

    expect(mockForwardEvent).toHaveBeenCalledTimes(2);
  });

  it('scans the last 24h, passing the same since window to every event type', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
      mockProjectionRules.push({ eventType: 'application_submitted' }, { eventType: 'certificate_issued' });

      await forwardAllEventsToPostHogCron();

      const since = '2026-06-17T12:00:00.000Z';
      expect(mockForwardEvent.mock.calls.every(([arg]) => arg.since === since)).toBe(true);
      expect(mockForwardEvent).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
