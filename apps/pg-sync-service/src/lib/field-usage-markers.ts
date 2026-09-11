import { PgAirtableTable } from '@bluedot/db';
import * as schema from '@bluedot/db/src/schema';
import { logger } from '@bluedot/ui/src/api';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { rateLimiter } from './pg-sync';
import env from '../env';

export const USAGE_MARKER = 'Consider deletion on: Never (used in code)';
const DELETION_LINE = /^Consider deletion on: .*$/m;
// A token without schema write scope would otherwise fail on every field of every base
const MAX_FAILURES = 5;

type AirtableTablesResponse = {
  tables: { id: string; name: string; fields: { id: string; name: string; description?: string }[] }[];
};

export const addUsageMarker = (description: string): string => {
  if (DELETION_LINE.test(description)) return description.replace(DELETION_LINE, USAGE_MARKER);
  return description.trim() ? `${description.trimEnd()}\n${USAGE_MARKER}` : USAGE_MARKER;
};

export const removeUsageMarker = (description: string): string => {
  const lines = description.split('\n');
  return lines.includes(USAGE_MARKER) ? lines.filter((line) => line !== USAGE_MARKER).join('\n').trimEnd() : description;
};

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export const syncFieldUsageMarkers = async (): Promise<{ updated: number; failures: string[] }> => {
  const result = { updated: 0, failures: [] as string[] };

  // Returns the response body, or undefined after recording the failure
  const airtableMetaRequest = async (label: string, path: string, init?: RequestInit): Promise<unknown> => {
    try {
      await rateLimiter.acquire();
      const response = await fetch(`https://api.airtable.com/v0/meta/bases/${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error: unknown) {
      result.failures.push(`${label}: ${errorMessage(error)}`);
      if (result.failures.length >= MAX_FAILURES) throw new Error(`Stopped after ${MAX_FAILURES} failures`);
      return undefined;
    }
  };

  try {
    const baseIds = new Set<string>();
    const fieldIdsInSchema = new Set<string>();
    for (const table of Object.values(schema)) {
      if (table instanceof PgAirtableTable) {
        baseIds.add(table.airtable.baseId);
        for (const fieldId of table.airtableFieldMap.values()) fieldIdsInSchema.add(fieldId);
      }
    }

    for (const baseId of baseIds) {
      // eslint-disable-next-line no-await-in-loop
      const base = await airtableMetaRequest(`list base ${baseId}`, `${baseId}/tables`) as AirtableTablesResponse | undefined;
      const fields = (base?.tables ?? []).flatMap((table) => table.fields.map((field) => ({ table, field })));
      for (const { table, field } of fields) {
        const current = field.description ?? '';
        const wanted = fieldIdsInSchema.has(field.id) ? addUsageMarker(current) : removeUsageMarker(current);
        if (wanted === current) continue;
        const path = `${baseId}/tables/${table.id}/fields/${field.id}`;
        // eslint-disable-next-line no-await-in-loop
        const updated = await airtableMetaRequest(`update ${table.name} / ${field.name}`, path, { method: 'PATCH', body: JSON.stringify({ description: wanted }) });
        if (updated !== undefined) result.updated += 1;
      }
    }
  } catch (error: unknown) {
    result.failures.push(errorMessage(error));
  }

  logger.info(`[field-usage-markers] Updated ${result.updated} field description(s), ${result.failures.length} failure(s)`);
  if (result.failures.length > 0) {
    await slackAlert(env, [`[field-usage-markers] ${result.failures.length} failure(s) updating Airtable field descriptions:\n${result.failures.slice(0, 10).join('\n')}`]);
  }

  return result;
};
