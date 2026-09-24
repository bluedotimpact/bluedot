import {
  afterEach, beforeEach, describe, expect, test, vi, type MockInstance,
} from 'vitest';
import { AirtableTsError } from 'airtable-ts/dist/AirtableTsError';
import { ErrorType } from 'airtable-ts/dist/AirtableTsError';
import { WrappedAirtableError } from 'airtable-ts/dist/wrapToCatchAirtableErrors';
import AirtableError from 'airtable/lib/airtable_error';
import { DrizzleQueryError, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import {
  isRetryableAirtableError, isRetryablePgError, retryDelayMs, patchPgClientToRetryQueries, withAirtableRetry, withPgRetryIdempotentWrite,
} from './retry';
import { PgAirtableDb } from '../index';
import type { PgAirtableTable } from '../index';

let setTimeoutSpy: MockInstance<typeof setTimeout>;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout'] });
  setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const backoffs = () => setTimeoutSpy.mock.calls.map(([, ms]) => ms);

/** Fast-forwards through every backoff sleep, then settles like `promise`. */
const settle = async <T>(promise: Promise<T>): Promise<T> => {
  promise.catch(() => {});
  await vi.runAllTimersAsync();
  return promise;
};

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
    const result = await withAirtableRetry(async () => 'ok');
    expect(result).toBe('ok');
    expect(backoffs()).toEqual([]);
  });

  test('retries a 429 then returns success, sleeping once', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(apiError('Failed to get base schema: Status: 429. Data: {}'))
      .mockResolvedValue('recovered');

    const result = await settle(withAirtableRetry(operation, { baseDelayMs: 250 }));

    expect(result).toBe('recovered');
    expect(operation).toHaveBeenCalledTimes(2);
    expect(backoffs()).toEqual([250]);
  });

  test('adds a small random jitter to the backoff', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const operation = vi.fn()
      .mockRejectedValueOnce(apiError('Failed to get base schema: Status: 429. Data: {}'))
      .mockResolvedValue('recovered');

    await settle(withAirtableRetry(operation, { baseDelayMs: 250 }));

    expect(backoffs()).toEqual([250 + 125]);
  });

  test('does not retry non-retryable errors', async () => {
    const operation = vi.fn(async () => {
      throw validationError('Cannot convert null value to number');
    });

    await expect(withAirtableRetry(operation)).rejects.toThrow('Cannot convert null');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(backoffs()).toEqual([]);
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

  test('update retries a 503 across four attempts', async () => {
    const update = vi.fn(async () => {
      throw failure(503);
    });
    const db = setup({ update });
    await expect(settle(db.update(table, { id: 'rec1' }))).rejects.toThrow('airtable blip');
    expect(update).toHaveBeenCalledTimes(4);
  });

  test('insert retries a 429 to success', async () => {
    const insert = vi
      .fn()
      .mockRejectedValueOnce(failure(429))
      .mockResolvedValueOnce({ id: 'rec1', fields: {} });
    const db = setup({ insert });
    await expect(settle(db.insert(table, {}))).resolves.toEqual({ id: 'rec1' });
    expect(insert).toHaveBeenCalledTimes(2);
    expect(db.replicatedCalls).toBe(1);
  });

  test('remove retries a 503 across four attempts', async () => {
    const remove = vi.fn(async () => {
      throw failure(503);
    });
    const db = setup({ remove });
    await expect(settle(db.remove(table, 'rec1'))).rejects.toThrow('airtable blip');
    expect(remove).toHaveBeenCalledTimes(4);
    expect(db.replicatedCalls).toBe(0);
  });
});

const pgError = (code: string, message = `pg error ${code}`) => Object.assign(new Error(message), { code });

describe('isRetryablePgError', () => {
  test('retries connect errors for every query, including the drizzle-wrapped shape seen in prod', () => {
    expect(isRetryablePgError(pgError('ECONNREFUSED'))).toBe(true);
    expect(isRetryablePgError(new DrizzleQueryError('select 1', [], pgError('ECONNREFUSED')))).toBe(true);
    expect(isRetryablePgError(pgError('57P03', 'the database system is starting up'))).toBe(true);
    expect(isRetryablePgError(pgError('EAI_AGAIN'))).toBe(true);
  });

  test('retries a lost connection only for idempotent queries', () => {
    const lost = [
      pgError('ECONNRESET'),
      pgError('57P01', 'terminating connection due to administrator command'),
      pgError('57P02'),
      pgError('08006'),
      new Error('Connection terminated unexpectedly'),
      new DrizzleQueryError('select 1', [], new Error('Connection terminated')),
    ];
    lost.forEach((error) => {
      expect(isRetryablePgError(error)).toBe(false);
      expect(isRetryablePgError(error, true)).toBe(true);
    });
  });

  test('does not retry timeouts, query errors, or unknown errors', () => {
    expect(isRetryablePgError(pgError('ETIMEDOUT'))).toBe(false);
    expect(isRetryablePgError(pgError('ETIMEDOUT'), true)).toBe(false);
    expect(isRetryablePgError(new Error('Connection terminated due to connection timeout'), true)).toBe(false);
    expect(isRetryablePgError(pgError('08P01', 'protocol violation'), true)).toBe(false);
    expect(isRetryablePgError(pgError('23505', 'duplicate key value'), true)).toBe(false);
    expect(isRetryablePgError(pgError('42P01', 'relation does not exist'), true)).toBe(false);
    expect(isRetryablePgError(new Error('Something else'), true)).toBe(false);
    expect(isRetryablePgError(null, true)).toBe(false);
  });
});

describe('patchPgClientToRetryQueries', () => {
  const unreachable = 'postgresql://user:pass@127.0.0.1:1/db';

  const setup = (...results: unknown[]) => {
    const query = vi.fn();
    results.forEach((result) => {
      if (result instanceof Error) query.mockRejectedValueOnce(result);
      else query.mockResolvedValueOnce(result);
    });
    const pool = { query, on: vi.fn() };
    patchPgClientToRetryQueries(pool);
    return { pool, query };
  };

  test('retries a connect error for a write, then returns its result', async () => {
    const { pool, query } = setup(pgError('ECONNREFUSED'), pgError('ECONNREFUSED'), { rows: ['ok'] });
    await expect(settle(pool.query({ text: 'insert into "person" ...' }, []))).resolves.toEqual({ rows: ['ok'] });
    expect(query).toHaveBeenCalledTimes(3);
    expect(backoffs()).toEqual([1000, 2000]);
  });

  test('retries a lost connection for a read', async () => {
    const { pool, query } = setup(new Error('Connection terminated unexpectedly'), { rows: [] });
    await expect(settle(pool.query({ text: 'select "id" from "person"' }, []))).resolves.toEqual({ rows: [] });
    expect(query).toHaveBeenCalledTimes(2);
  });

  test('does not retry a lost connection for a write, which may have applied', async () => {
    const { pool, query } = setup(new Error('Connection terminated unexpectedly'), { rows: [] });
    await expect(pool.query({ text: 'insert into "person" ...' }, [])).rejects.toThrow('Connection terminated');
    expect(query).toHaveBeenCalledTimes(1);
  });

  test('gives up after four attempts against a real unreachable server', async () => {
    const db = drizzle({ connection: unreachable });
    patchPgClientToRetryQueries(db.$client);
    // Each refusal arrives over real I/O, so wait for its backoff to be scheduled before firing it
    const fireNextBackoff = async () => {
      await vi.waitUntil(() => vi.getTimerCount() > 0);
      await vi.runOnlyPendingTimersAsync();
    };

    const error = db.execute(sql`select 1`).catch((e: unknown) => e);
    await fireNextBackoff();
    await fireNextBackoff();
    await fireNextBackoff();

    expect(await error).toBeInstanceOf(DrizzleQueryError);
    expect(((await error) as DrizzleQueryError).cause).toMatchObject({ code: 'ECONNREFUSED' });
    expect(backoffs()).toEqual([1000, 2000, 4000]);
    await db.$client.end();
  });

  test('an idle client error does not crash the process', async () => {
    const db = drizzle({ connection: unreachable });
    patchPgClientToRetryQueries(db.$client);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => db.$client.emit('error', new Error('terminating connection due to administrator command'))).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
    await db.$client.end();
  });
});

describe('withPgRetryIdempotentWrite', () => {
  test('retries a lost connection, leaving connect errors to the pool', async () => {
    const upsert = vi.fn()
      .mockRejectedValueOnce(new DrizzleQueryError('insert ...', [], pgError('57P01')))
      .mockResolvedValue([{ id: 'rec1' }]);
    await expect(settle(withPgRetryIdempotentWrite(upsert))).resolves.toEqual([{ id: 'rec1' }]);
    expect(upsert).toHaveBeenCalledTimes(2);

    const refused = vi.fn(async () => {
      throw pgError('ECONNREFUSED');
    });
    await expect(withPgRetryIdempotentWrite(refused)).rejects.toThrow();
    expect(refused).toHaveBeenCalledTimes(1);
  });
});
