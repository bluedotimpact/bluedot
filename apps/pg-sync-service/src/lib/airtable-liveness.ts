import { courseTable, type PgAirtableDb } from '@bluedot/db';
import { logger } from '@bluedot/ui/src/api';

type AirtableClient = PgAirtableDb['airtableClient'];

const MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

/**
 * Verifies the airtable package can actually reach Airtable before the service
 * starts processing rows. A broken airtable-ts errors on every request, so a
 * single cheap round-trip surfaces the outage at startup rather than silently
 * failing later once rows are being synced.
 */
export const assertAirtableLiveness = async (
  airtableClient: AirtableClient,
  retryDelayMs: number = DEFAULT_RETRY_DELAY_MS,
): Promise<void> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await airtableClient.scan(courseTable.airtable, { maxRecords: 1 });
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_ATTEMPTS) {
        logger.warn(`[airtable-liveness] Check failed (attempt ${attempt}/${MAX_ATTEMPTS}), retrying...`, error);
        // eslint-disable-next-line no-await-in-loop -- Intentional retry delay
        await new Promise((resolve) => {
          setTimeout(resolve, retryDelayMs);
        });
      }
    }
  }

  throw new Error(`Airtable liveness check failed after ${MAX_ATTEMPTS} attempts: ${lastError?.message}`);
};
