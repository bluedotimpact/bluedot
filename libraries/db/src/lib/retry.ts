import { DrizzleQueryError } from 'drizzle-orm';
import { AirtableTsError } from 'airtable-ts/dist/AirtableTsError';
import { ErrorType } from 'airtable-ts/dist/AirtableTsError';

// Max wait: ~7s (waits: 1s, 2s, 4s)
export const MAX_ATTEMPTS = 4;
export const BASE_DELAY_MS = 1000;
export const JITTER_MAX_MS = 250;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

/**
 * Airtable asks clients to retry 429s and 5xx with backoff.
 * A 429 means rejected, never applied, so it always retries. A 5xx may
 * have applied, so it retries only idempotent reads and writes by id
 * (callers must set absolute values, never deltas).
 * It never retries inserts, which would double-create.
 *
 * Two error shapes reach us: AirtableTsError (schema fetch, status in
 * the message) and airtable.js errors (CRUD calls, status on the
 * statusCode prop). A small random jitter spreads concurrent retries
 * so they don't re-hit the rate limit in lockstep.
 */
function airtableStatus(error: unknown): number | undefined {
  if (error instanceof AirtableTsError) {
    const match = /Status:\s*(\d{3})\b/.exec(error.message);
    return match ? Number(match[1]) : undefined;
  }

  const statusCode = (error as { statusCode?: unknown } | null | undefined)?.statusCode;
  return typeof statusCode === 'number' ? statusCode : undefined;
}

export function isRetryableAirtableError(error: unknown, idempotent = false): boolean {
  if (error instanceof AirtableTsError && error.type !== ErrorType.API_ERROR) return false;
  const message = error instanceof AirtableTsError ? error.message : '';
  const status = airtableStatus(error);
  if (status === 429 || /rate limit/i.test(message)) return true;
  if (!idempotent) return false;
  return status === 500 || status === 502 || status === 503 || status === 504 || /temporarily unavailable/i.test(message);
}

export function retryDelayMs(attempt: number, baseDelayMs = BASE_DELAY_MS): number {
  return baseDelayMs * 2 ** (attempt - 1);
}

type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
};

async function withRetry<T>(
  operation: () => Promise<T>,
  isRetryable: (error: unknown) => boolean,
  options?: RetryOptions,
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? MAX_ATTEMPTS;
  const baseDelayMs = options?.baseDelayMs ?? BASE_DELAY_MS;

  const attempt = async (attemptNumber: number): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (attemptNumber >= maxAttempts || !isRetryable(error)) throw error;
      await sleep(retryDelayMs(attemptNumber, baseDelayMs) + Math.floor(Math.random() * JITTER_MAX_MS));
      return attempt(attemptNumber + 1);
    }
  };

  return attempt(1);
}

export async function withAirtableRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions & { idempotent?: boolean },
): Promise<T> {
  return withRetry(operation, (error) => isRetryableAirtableError(error, options?.idempotent), options);
}

const PG_CONNECT_ERROR_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', '57P03', '08001', '08004']);
const PG_CONNECTION_LOST_ERROR_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'EPIPE', '57P01', '57P02']);
// pg-pool's error when `connectionTimeoutMillis` expires before the connection is established
const PG_CONNECT_TIMEOUT_MESSAGE = 'Connection terminated due to connection timeout';

function pgErrorDetails(error: unknown): { code?: string; message: string } {
  const pgError = error instanceof DrizzleQueryError ? error.cause : error;
  const code = (pgError as { code?: unknown } | null | undefined)?.code;
  return {
    code: typeof code === 'string' ? code : undefined,
    message: pgError instanceof Error ? pgError.message : '',
  };
}

function isPgConnectError(error: unknown): boolean {
  const { code, message } = pgErrorDetails(error);
  return (code !== undefined && PG_CONNECT_ERROR_CODES.has(code)) || message === PG_CONNECT_TIMEOUT_MESSAGE;
}

function isPgConnectionLostError(error: unknown): boolean {
  if (isPgConnectError(error)) return false;
  const { code = '', message } = pgErrorDetails(error);
  // SQLSTATE class 08 is "connection exception"
  return message.startsWith('Connection terminated') || PG_CONNECTION_LOST_ERROR_CODES.has(code) || code.startsWith('08');
}

export function isRetryablePgError(error: unknown, idempotent = false): boolean {
  return isPgConnectError(error) || (idempotent && isPgConnectionLostError(error));
}

/** The subset of a node-postgres `Pool` we patch (`pg` ships no types of its own). */
type PgPool = {
  query: (...args: unknown[]) => Promise<unknown>;
  on: (event: 'error', listener: (error: Error) => void) => unknown;
};

const isReadQuery = (query: unknown): boolean => {
  const text = typeof query === 'string' ? query : (query as { text?: unknown } | null | undefined)?.text;
  return typeof text === 'string' && /^\s*select\b/i.test(text);
};

/** Retries every query sent through `pool.query`, treating reads as idempotent. */
export function patchPgClientToRetryQueries(pool: PgPool): void {
  const query = pool.query.bind(pool);
  pool.query = async (...args: unknown[]) => withRetry(
    () => query(...args),
    (error) => isRetryablePgError(error, isReadQuery(args[0])),
  );

  // Idle clients dropped by the server emit here; unhandled, that crashes the process
  pool.on('error', (error) => {
    // eslint-disable-next-line no-console
    console.warn(`[PgAirtableDb] Idle Postgres client error: ${error.message}`);
  });
}

/** For idempotent writes. Connect errors are already retried inside `patchPgClientToRetryQueries`. */
export async function withPgRetryIdempotentWrite<T>(operation: () => Promise<T>): Promise<T> {
  return withRetry(operation, isPgConnectionLostError);
}
