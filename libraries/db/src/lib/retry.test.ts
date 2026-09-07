import {
  describe, expect, test, vi,
} from 'vitest';
import { AirtableTsError } from 'airtable-ts/dist/AirtableTsError';
import { ErrorType } from 'airtable-ts/dist/AirtableTsError';
import { WrappedAirtableError } from 'airtable-ts/dist/wrapToCatchAirtableErrors';
// eslint-disable-next-line import/no-extraneous-dependencies -- real airtable.js error class for faithful retry tests
import AirtableError from 'airtable/lib/airtable_error';
import { isRetryableAirtableError, retryDelayMs, withAirtableRetry } from './retry';
import { PgAirtableDb } from '../index';
import type { PgAirtableTable } from '../index';

const apiError = (message: string) => new AirtableTsError({ message, type: ErrorType.API_ERROR });
const validationError = (message: string) => new AirtableTsError({ message, type: ErrorType.SCHEMA_VALIDATION });

describe('isRetryableAirtableError', () => {
  test('retries the observed 429 schema error and the 503 outage error', () => {
    expect(isRetryableAirtableError(apiError('Failed to get base schema: Status: 429. Data: {}'))).toBe(true);
    expect(isRetryableAirtableError(apiError('The service is temporarily unavailable. Please retry shortly.'), true)).toBe(true);
  });

  test('retries 429s even for non-idempotent inserts, but never 5xx', () => {
    expect(isRetryableAirtableError(apiError('Status: 429'))).toBe(true);
    expect(isRetryableAirtableError(apiError('Status: 500'))).toBe(false);
    expect(isRetryableAirtableError(apiError('Status: 500'), true)).toBe(true);
    expect(isRetryableAirtableError(apiError('Status: 503'))).toBe(false);
    expect(isRetryableAirtableError(apiError('Status: 503'), true)).toBe(true);
  });

  test('retries the airtable.js CRUD shape via statusCode', () => {
    const crudError = (statusCode: number) => new WrappedAirtableError(new AirtableError(
      'SERVICE_UNAVAILABLE',
      'The service is temporarily unavailable. Please retry shortly.',
      statusCode,
    ));
    expect(isRetryableAirtableError(crudError(429))).toBe(true);
    expect(isRetryableAirtableError(crudError(503))).toBe(false);
    expect(isRetryableAirtableError(crudError(503), true)).toBe(true);
    expect(isRetryableAirtableError(crudError(422), true)).toBe(false);
  });

  test('does not retry validation, not-found, or non-Airtable errors', () => {
    expect(isRetryableAirtableError(validationError('Cannot convert null value to number'))).toBe(false);
    expect(isRetryableAirtableError(apiError('Unknown field name: fldX'))).toBe(false);
    expect(isRetryableAirtableError(new Error('Status: 429'))).toBe(false);
    expect(isRetryableAirtableError('Status: 429')).toBe(false);
  });
});

describe('retryDelayMs', () => {
  test('backs off exponentially from the base delay', () => {
    expect(retryDelayMs(1, 250)).toBe(250);
    expect(retryDelayMs(2, 250)).toBe(500);
    expect(retryDelayMs(3, 250)).toBe(1000);
    expect(retryDelayMs(4, 250)).toBe(2000);
  });
});

describe('withAirtableRetry', () => {
  test('returns the first success without sleeping', async () => {
    const sleep = vi.fn(async () => {});
    const result = await withAirtableRetry(async () => 'ok', { sleep });
    expect(result).toBe('ok');
    expect(sleep).not.toHaveBeenCalled();
  });

  test('retries a 429 then returns success, sleeping once', async () => {
    const sleep = vi.fn(async () => {});
    const operation = vi.fn()
      .mockRejectedValueOnce(apiError('Failed to get base schema: Status: 429. Data: {}'))
      .mockResolvedValue('recovered');

    const result = await withAirtableRetry(operation, { sleep, baseDelayMs: 250, random: () => 0 });

    expect(result).toBe('recovered');
    expect(operation).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(250);
  });

  test('adds a small random jitter to the backoff', async () => {
    const sleep = vi.fn(async () => {});
    const operation = vi.fn()
      .mockRejectedValueOnce(apiError('Failed to get base schema: Status: 429. Data: {}'))
      .mockResolvedValue('recovered');

    await withAirtableRetry(operation, { sleep, baseDelayMs: 250, random: () => 0.5 });

    expect(sleep).toHaveBeenCalledWith(250 + 125);
  });

  test('does not retry non-retryable errors', async () => {
    const sleep = vi.fn(async () => {});
    const operation = vi.fn(async () => {
      throw validationError('Cannot convert null value to number');
    });

    await expect(withAirtableRetry(operation, { sleep })).rejects.toThrow('Cannot convert null');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});

describe('isRetryableAirtableError edge cases', () => {
  test('ignores nullish and foreign errors', () => {
    expect(isRetryableAirtableError(null)).toBe(false);
    expect(isRetryableAirtableError(undefined)).toBe(false);
    expect(isRetryableAirtableError({ statusCode: 503 })).toBe(false);
  });
});

describe('PgAirtableDb retry plumbing', () => {
  const table = { airtable: { baseId: 'appX', tableId: 'tblY' } } as unknown as PgAirtableTable;

  class NoPgDb extends PgAirtableDb {
    replicatedCalls = 0;

    override async ensureReplicated(): Promise<never> {
      this.replicatedCalls += 1;
      return { id: 'rec1' } as never;
    }
  }

  const setup = (airtableClient: unknown) => new NoPgDb({
    pgConnString: 'unused',
    airtableApiKey: 'unused',
    pgClient: {} as never,
    airtableClient: airtableClient as never,
  });

  const failure = (statusCode: number) => new WrappedAirtableError(new AirtableError('ERR', 'airtable blip', statusCode));

  test('insert tries a 503 once, then surfaces it like today', async () => {
    const insert = vi.fn(async () => {
      throw failure(503);
    });
    const db = setup({ insert });
    await expect(db.insert(table, {})).rejects.toThrow('airtable blip');
    expect(insert).toHaveBeenCalledTimes(1);
    expect(db.replicatedCalls).toBe(0);
  });

  test('update retries a 503 across three attempts', async () => {
    const update = vi.fn(async () => {
      throw failure(503);
    });
    const db = setup({ update });
    await expect(db.update(table, { id: 'rec1' })).rejects.toThrow('airtable blip');
    expect(update).toHaveBeenCalledTimes(3);
  }, 15000);

  test('insert retries a 429 to success', async () => {
    const insert = vi
      .fn()
      .mockRejectedValueOnce(failure(429))
      .mockResolvedValueOnce({ id: 'rec1', fields: {} });
    const db = setup({ insert });
    await expect(db.insert(table, {})).resolves.toEqual({ id: 'rec1' });
    expect(insert).toHaveBeenCalledTimes(2);
    expect(db.replicatedCalls).toBe(1);
  }, 15000);

  test('remove retries a 503 across three attempts', async () => {
    const remove = vi.fn(async () => {
      throw failure(503);
    });
    const db = setup({ remove });
    await expect(db.remove(table, 'rec1')).rejects.toThrow('airtable blip');
    expect(remove).toHaveBeenCalledTimes(3);
    expect(db.replicatedCalls).toBe(0);
  }, 15000);
});
