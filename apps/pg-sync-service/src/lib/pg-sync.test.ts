import {
  describe,
  expect,
  test,
  beforeEach,
  vi,
} from 'vitest';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import {
  addToQueue,
  processUpdateQueue,
  getQueueStatus,
  deduplicateActions,
  clearQueues,
  MAX_RETRIES,
} from './pg-sync';
import type { AirtableAction } from './webhook';

// Mock the db module
vi.mock('./db', () => ({
  db: {
    pg: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    },
    ensureReplicated: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@bluedot/utils/src/slackNotifications', () => ({
  slackAlert: vi.fn(),
}));

// Mock the @bluedot/db module
vi.mock('@bluedot/db', () => ({
  eq: vi.fn(),
  inArray: vi.fn(),
  and: vi.fn(),
  getPgAirtableFromIds: vi.fn().mockReturnValue({
    airtable: { name: 'test' },
  }),
  metaTable: {
    airtableBaseId: 'baseId',
    airtableTableId: 'tableId',
    airtableFieldId: 'fieldId',
    enabled: 'enabled',
  },
  syncMetadataTable: {},
}));

describe('deduplicateActions', () => {
  test('deduplicates actions by baseId, tableId, recordId and unions fieldIds, ORs isDelete', () => {
    const input = [
      // Unique action
      {
        baseId: 'b1', tableId: 't1', recordId: 'r1', fieldIds: ['f1'], isDelete: false,
      },
      // Duplicate with new field, isDelete false
      {
        baseId: 'b1', tableId: 't1', recordId: 'r1', fieldIds: ['f2'], isDelete: false,
      },
      // Duplicate with no fieldIds, isDelete true
      {
        baseId: 'b1', tableId: 't1', recordId: 'r1', isDelete: true,
      },
      // Completely different action
      {
        baseId: 'b2', tableId: 't2', recordId: 'r2', fieldIds: ['f3'], isDelete: false,
      },
      // Duplicate of above, no fieldIds, isDelete false
      {
        baseId: 'b2', tableId: 't2', recordId: 'r2', isDelete: false,
      },
      // Duplicate of above, new field, isDelete true
      {
        baseId: 'b2', tableId: 't2', recordId: 'r2', fieldIds: ['f4'], isDelete: true,
      },
      // Unique, no fieldIds, no isDelete
      { baseId: 'b3', tableId: 't3', recordId: 'r3' },
    ];

    const result = deduplicateActions(input);

    const expected = [
      {
        baseId: 'b1',
        tableId: 't1',
        recordId: 'r1',
        fieldIds: ['f1', 'f2'],
        isDelete: true,
      },
      {
        baseId: 'b2',
        tableId: 't2',
        recordId: 'r2',
        fieldIds: ['f3', 'f4'],
        isDelete: true,
      },
      {
        baseId: 'b3',
        tableId: 't3',
        recordId: 'r3',
      },
    ];

    // Sort arrays for stable comparison
    const normalize = (arr: typeof result) => arr.map((obj) => ({
      ...obj,
      fieldIds: obj.fieldIds ? [...obj.fieldIds].sort() : undefined,
    }))
      .sort((a, b) => {
        if (a.baseId !== b.baseId) {
          return a.baseId.localeCompare(b.baseId);
        }

        if (a.tableId !== b.tableId) {
          return a.tableId.localeCompare(b.tableId);
        }

        return a.recordId.localeCompare(b.recordId);
      });

    expect(normalize(result)).toEqual(normalize(expected));
  });

  test('returns empty array for empty input', () => {
    expect(deduplicateActions([])).toEqual([]);
  });
});

describe('pg-sync priority queue', () => {
  beforeEach(() => {
    // Clear queues between tests to ensure test isolation
    clearQueues();
    vi.clearAllMocks();
  });

  test('should process high priority items first', async () => {
    const processOrder: string[] = [];

    const testProcessor = async (update: AirtableAction): Promise<boolean> => {
      processOrder.push(update.recordId);
      return true;
    };

    const lowPriorityUpdate: AirtableAction = {
      baseId: 'base1',
      tableId: 'table1',
      recordId: 'low1',
      isDelete: false,
      fieldIds: ['field1'],
    };

    const highPriorityUpdate: AirtableAction = {
      baseId: 'base1',
      tableId: 'table1',
      recordId: 'high1',
      isDelete: false,
      fieldIds: ['field1'],
    };

    addToQueue([lowPriorityUpdate], 'low');
    addToQueue([highPriorityUpdate], 'high');

    await processUpdateQueue(testProcessor);

    expect(processOrder).toEqual(['high1', 'low1']);
  });

  test('should interrupt low priority processing for new high priority items', async () => {
    const processOrder: string[] = [];

    const testProcessor = async (update: AirtableAction): Promise<boolean> => {
      processOrder.push(update.recordId);

      if (update.recordId === 'low1') {
        const highPriorityUpdate: AirtableAction = {
          baseId: 'base1',
          tableId: 'table1',
          recordId: 'high1',
          isDelete: false,
          fieldIds: ['field1'],
        };
        addToQueue([highPriorityUpdate], 'high');
      }

      return true;
    };

    const lowPriorityUpdates: AirtableAction[] = [
      {
        baseId: 'base1',
        tableId: 'table1',
        recordId: 'low1',
        isDelete: false,
        fieldIds: ['field1'],
      },
      {
        baseId: 'base1',
        tableId: 'table1',
        recordId: 'low2',
        isDelete: false,
        fieldIds: ['field1'],
      },
    ];

    addToQueue(lowPriorityUpdates, 'low');

    await processUpdateQueue(testProcessor);

    expect(processOrder).toEqual(['low1', 'high1', 'low2']);
  });

  test('should handle empty queues gracefully', async () => {
    const status = getQueueStatus();
    expect(status.high).toBe(0);
    expect(status.low).toBe(0);

    await processUpdateQueue();

    const statusAfter = getQueueStatus();
    expect(statusAfter.high).toBe(0);
    expect(statusAfter.low).toBe(0);
  });

  test('should retry failed updates on low priority queue up to MAX_RETRIES', async () => {
    const processOrder: string[] = [];
    const attempts: Record<string, number> = {};

    const testProcessor = async (update: AirtableAction): Promise<boolean> => {
      const key = update.recordId;
      attempts[key] = (attempts[key] ?? 0) + 1;
      processOrder.push(`${key}-attempt${attempts[key]}`);

      // fail1 always fails, success1 always succeeds
      if (key === 'fail1') {
        return false;
      }

      return true;
    };

    const updates: AirtableAction[] = [
      {
        baseId: 'base1',
        tableId: 'table1',
        recordId: 'fail1',
        isDelete: false,
        fieldIds: ['field1'],
      },
      {
        baseId: 'base1',
        tableId: 'table1',
        recordId: 'success1',
        isDelete: false,
        fieldIds: ['field1'],
      },
    ];

    addToQueue(updates, 'high');

    // Process multiple times to test retry behavior
    await processUpdateQueue(testProcessor);
    await processUpdateQueue(testProcessor);
    await processUpdateQueue(testProcessor);
    await processUpdateQueue(testProcessor); // This should not retry fail1 anymore

    // fail1 should be attempted 3 times (initial + 2 retries), success1 once
    expect(attempts.fail1).toBe(3);
    expect(attempts.success1).toBe(1);

    // Should see fail1 attempted 3 times, success1 once
    expect(processOrder).toEqual([
      'fail1-attempt1',
      'success1-attempt1',
      'fail1-attempt2',
      'fail1-attempt3',
    ]);

    // Queues should be empty after giving up on fail1
    const finalStatus = getQueueStatus();
    expect(finalStatus.high).toBe(0);
    expect(finalStatus.low).toBe(0);

    // Slack alert should be called once for final failure
    expect(vi.mocked(slackAlert)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(slackAlert)).toHaveBeenCalledWith(
      expect.any(Object),
      expect.arrayContaining([
        expect.stringContaining(`Update failed after ${MAX_RETRIES} attempts, giving up: base1/table1/fail1`),
      ]),
    );
  });
});
