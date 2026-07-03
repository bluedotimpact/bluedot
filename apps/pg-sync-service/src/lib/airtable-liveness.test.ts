import {
  describe, expect, it, vi, beforeEach,
} from 'vitest';
import { assertAirtableLiveness } from './airtable-liveness';

vi.mock('@bluedot/ui/src/api', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@bluedot/db', () => ({
  courseTable: { airtable: { baseId: 'base', tableId: 'table', schema: {} } },
}));

// Minimal stand-in for the AirtableTs client; only scan() is exercised.
const makeClient = (scan: ReturnType<typeof vi.fn>) => ({ scan }) as unknown as Parameters<typeof assertAirtableLiveness>[0];

describe('assertAirtableLiveness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves when the first scan succeeds', async () => {
    const scan = vi.fn().mockResolvedValue([]);
    await expect(assertAirtableLiveness(makeClient(scan), 0)).resolves.toBeUndefined();
    expect(scan).toHaveBeenCalledTimes(1);
  });

  it('throws after 3 failed attempts', async () => {
    const scan = vi.fn().mockRejectedValue(new Error('airtable down'));
    await expect(assertAirtableLiveness(makeClient(scan), 0)).rejects.toThrow('Airtable liveness check failed after 3 attempts: airtable down');
    expect(scan).toHaveBeenCalledTimes(3);
  });

  it('retries and resolves when a later attempt succeeds', async () => {
    const scan = vi.fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce([]);
    await expect(assertAirtableLiveness(makeClient(scan), 0)).resolves.toBeUndefined();
    expect(scan).toHaveBeenCalledTimes(2);
  });
});
