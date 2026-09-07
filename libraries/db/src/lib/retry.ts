import { AirtableTsError } from 'airtable-ts/dist/AirtableTsError';
import { ErrorType } from 'airtable-ts/dist/AirtableTsError';

export const MAX_ATTEMPTS = 3;
export const BASE_DELAY_MS = 1000;
export const JITTER_MAX_MS = 250;

const defaultSleep = (ms: number): Promise<void> => new Promise((resolve) => {
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

export async function withAirtableRetry<T>(
  operation: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    baseDelayMs?: number;
    sleep?: (ms: number) => Promise<void>;
    idempotent?: boolean;
    random?: () => number;
  },
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? MAX_ATTEMPTS;
  const baseDelayMs = options?.baseDelayMs ?? BASE_DELAY_MS;
  const sleep = options?.sleep ?? defaultSleep;
  const idempotent = options?.idempotent ?? false;
  const random = options?.random ?? Math.random;

  const attempt = async (attemptNumber: number): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (attemptNumber >= maxAttempts || !isRetryableAirtableError(error, idempotent)) throw error;
      await sleep(retryDelayMs(attemptNumber, baseDelayMs) + Math.floor(random() * JITTER_MAX_MS));
      return attempt(attemptNumber + 1);
    }
  };

  return attempt(1);
}
