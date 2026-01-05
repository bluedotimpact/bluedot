import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  processTableForInitialSync,
} from './scan';
import * as pgSync from './pg-sync';
import * as dbModule from './db';

vi.mock('./db', () => ({
  db: {
    airtableClient: {
      scan: vi.fn(),
    },
  },
}));

vi.mock('@bluedot/db', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  inArray: vi.fn(),
  metaTable: {},
  getPgAirtableFromIds: vi.fn().mockReturnValue({
    airtable: {
      name: 'testTable',
      baseId: 'testBase',
      tableId: 'testTable',
      schema: { name: 'string' },
      mappings: { name: 'Name' },
    },
  }),
}));

vi.mock('@bluedot/utils/src/slackNotifications', () => ({
  slackAlert: vi.fn(),
}));

describe('processTableForInitialSync', () => {
  let mockAddToQueue: ReturnType<typeof vi.fn>;
  let mockPgAirtable: { airtable: { name: string; baseId: string; tableId: string; schema: Record<string, string>; mappings: Record<string, string> } };

  beforeEach(() => {
    mockAddToQueue = vi.fn();

    mockPgAirtable = {
      airtable: {
        name: 'testTable',
        baseId: 'testBase',
        tableId: 'testTable',
        schema: { name: 'string' },
        mappings: { name: 'Name' },
      },
    };

    vi.spyOn(pgSync, 'getQueueStatus').mockReturnValue({ high: 0, low: 0 });
    vi.clearAllMocks();
  });

  it('should process records correctly', async () => {
    const mockRecords = [
      { id: 'rec1', name: 'Record 1' },
      { id: 'rec2', name: 'Record 2' },
      { id: 'rec3', name: 'Record 3' },
    ];
    vi.mocked(dbModule.db.airtableClient.scan).mockResolvedValue(mockRecords);

    const totalRecords = await processTableForInitialSync(
      'testBase',
      'testTable',
      ['field1', 'field2'],
      // @ts-expect-error
      mockPgAirtable,
      mockAddToQueue,
    );

    expect(totalRecords).toBe(3);
    expect(mockAddToQueue).toHaveBeenCalledTimes(3);
    expect(dbModule.db.airtableClient.scan).toHaveBeenCalledWith(mockPgAirtable.airtable);

    expect(mockAddToQueue).toHaveBeenCalledWith(
      {
        baseId: 'testBase',
        tableId: 'testTable',
        recordId: 'rec1',
        isDelete: false,
        fieldIds: ['field1', 'field2'],
        recordData: { id: 'rec1', name: 'Record 1' },
      },
      'low',
    );
  });

  it('should handle empty results', async () => {
    vi.mocked(dbModule.db.airtableClient.scan).mockResolvedValue([]);

    const totalRecords = await processTableForInitialSync(
      'testBase',
      'testTable',
      ['field1'],
      // @ts-expect-error
      mockPgAirtable,
      mockAddToQueue,
    );

    expect(totalRecords).toBe(0);
    expect(mockAddToQueue).not.toHaveBeenCalled();
    expect(dbModule.db.airtableClient.scan).toHaveBeenCalledWith(mockPgAirtable.airtable);
  });

  it('should handle scan errors', async () => {
    const scanError = new Error('Scan failed');
    vi.mocked(dbModule.db.airtableClient.scan).mockRejectedValue(scanError);

    await expect(
      processTableForInitialSync(
        'testBase',
        'testTable',
        ['field1'],
        // @ts-expect-error
        mockPgAirtable,
        mockAddToQueue,
      ),
    ).rejects.toThrow('Failed to fetch records after 3 retries');

    expect(mockAddToQueue).not.toHaveBeenCalled();
  });
});
