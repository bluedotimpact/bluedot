import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  processTableForInitialSync,
} from './scan';
import * as pgSync from './pg-sync';
import * as dbModule from './db';

// Mock the db module
vi.mock('./db', () => ({
  db: {
    airtableClient: {
      scan: vi.fn(),
    },
  },
}));

describe('processTableForInitialSync', () => {
  let mockAddToQueue: ReturnType<typeof vi.fn>;
  let mockPgAirtable: { airtable: { name: string; baseId: string; tableId: string; schema: Record<string, string>; mappings: Record<string, string> } };

  beforeEach(() => {
    mockAddToQueue = vi.fn();

    // Create a proper mock pgAirtable object with the correct structure
    // @ts-expect-error - Using simplified mock structure for testing
    mockPgAirtable = {
      airtable: {
        name: 'testTable',
        baseId: 'testBase',
        tableId: 'testTable',
        schema: { name: 'string' },
        mappings: { name: 'Name' },
      },
    };

    // Mock getQueueStatus to avoid timeout issues
    vi.spyOn(pgSync, 'getQueueStatus').mockReturnValue({ high: 0, low: 0 });

    // Clear all mocks
    vi.clearAllMocks();
  });

  it('should process single page of records correctly', async () => {
    // Mock db.airtableClient.scan to return records
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
      mockPgAirtable,
      mockAddToQueue,
    );

    expect(totalRecords).toBe(3);
    expect(mockAddToQueue).toHaveBeenCalledTimes(3);
    expect(dbModule.db.airtableClient.scan).toHaveBeenCalledWith(mockPgAirtable.airtable);

    // Verify correct action structure with recordData
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
    // Mock db.airtableClient.scan to return empty array
    vi.mocked(dbModule.db.airtableClient.scan).mockResolvedValue([]);

    const totalRecords = await processTableForInitialSync(
      'testBase',
      'testTable',
      ['field1'],
      mockPgAirtable,
      mockAddToQueue,
    );

    expect(totalRecords).toBe(0);
    expect(mockAddToQueue).not.toHaveBeenCalled();
    expect(dbModule.db.airtableClient.scan).toHaveBeenCalledWith(mockPgAirtable.airtable);
  });

  it('should handle scan errors', async () => {
    // Mock db.airtableClient.scan to throw error
    const scanError = new Error('Scan failed');
    vi.mocked(dbModule.db.airtableClient.scan).mockRejectedValue(scanError);

    await expect(
      processTableForInitialSync(
        'testBase',
        'testTable',
        ['field1'],
        mockPgAirtable,
        mockAddToQueue,
      ),
    ).rejects.toThrow('Scan failed');

    expect(mockAddToQueue).not.toHaveBeenCalled();
  });

  it('should create actions with all provided field IDs', async () => {
    const fieldIds = ['field1', 'field2', 'field3'];
    const mockRecords = [{ id: 'rec1', name: 'Record 1' }];
    vi.mocked(dbModule.db.airtableClient.scan).mockResolvedValue(mockRecords);

    await processTableForInitialSync(
      'testBase',
      'testTable',
      fieldIds,
      mockPgAirtable,
      mockAddToQueue,
    );

    expect(mockAddToQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldIds: ['field1', 'field2', 'field3'],
        recordData: { id: 'rec1', name: 'Record 1' },
      }),
      'low',
    );
  });

  it('should show progress for large tables', async () => {
    // Create a large number of records to trigger progress logging
    const mockRecords = Array.from({ length: 12000 }, (_, i) => ({ id: `rec${i + 1}` }));
    vi.mocked(dbModule.db.airtableClient.scan).mockResolvedValue(mockRecords);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const totalRecords = await processTableForInitialSync(
      'testBase',
      'testTable',
      ['field1'],
      mockPgAirtable,
      mockAddToQueue,
    );

    expect(totalRecords).toBe(12000);
    expect(mockAddToQueue).toHaveBeenCalledTimes(12000);

    // Should show progress at 5000 and 10000 records
    expect(consoleSpy).toHaveBeenCalledWith('Progress: 5000/12000 (42%)');
    expect(consoleSpy).toHaveBeenCalledWith('Progress: 10000/12000 (83%)');

    consoleSpy.mockRestore();
  });

  it('should clear heartbeat interval on completion', async () => {
    const mockRecords = [{ id: 'rec1' }];
    vi.mocked(dbModule.db.airtableClient.scan).mockResolvedValue(mockRecords);

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    await processTableForInitialSync(
      'testBase',
      'testTable',
      ['field1'],
      mockPgAirtable,
      mockAddToQueue,
    );

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should clear heartbeat interval on error', async () => {
    vi.mocked(dbModule.db.airtableClient.scan).mockRejectedValue(new Error('Test error'));

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    await expect(
      processTableForInitialSync(
        'testBase',
        'testTable',
        ['field1'],
        mockPgAirtable,
        mockAddToQueue,
      ),
    ).rejects.toThrow('Test error');

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
