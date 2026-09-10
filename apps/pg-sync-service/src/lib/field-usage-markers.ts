import { PgAirtableTable } from '@bluedot/db';
import * as schema from '@bluedot/db/src/schema';
import { logger } from '@bluedot/ui/src/api';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { rateLimiter } from './pg-sync';
import env from '../env';

// Extends the existing "Consider deletion on:" convention in Airtable field descriptions
const USAGE_MARKER_LINE = /^Consider deletion on: Never \(used in code as of \d{4}-\d{2}-\d{2}\)$/m;
const ANY_DELETION_LINE = /^Consider deletion on: .*$/m;
// A token without schema write access would otherwise fail on every field of every base
const MAX_CONSECUTIVE_FAILURES = 5;
// Descriptions are re-read between batches so a human edit made mid-run is not overwritten
const WRITES_PER_READ = 25;
const MAX_ROUNDS_PER_BASE = 100;

const usageMarker = (date: string) => `Consider deletion on: Never (used in code as of ${date})`;

export const addUsageMarker = (description: string, date: string): string => {
  if (USAGE_MARKER_LINE.exec(description)?.[0] === usageMarker(date)) return description;
  if (ANY_DELETION_LINE.test(description)) return description.replace(ANY_DELETION_LINE, usageMarker(date));
  return description.trim() ? `${description.trimEnd()}\n${usageMarker(date)}` : usageMarker(date);
};

export const removeUsageMarker = (description: string): string => {
  if (!USAGE_MARKER_LINE.test(description)) return description;
  return description.replace(USAGE_MARKER_LINE, '').replace(/\n{3,}/g, '\n\n').trim();
};

type AirtableField = { id: string; name: string; description?: string };
type AirtableTable = { id: string; name: string; fields: AirtableField[] };
type DescriptionChange = { table: AirtableTable; field: AirtableField; description: string };

const airtableMetaRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  await rateLimiter.acquire();
  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
};

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const fieldsReferencedInSchema = () => {
  const baseIds = new Set<string>();
  const fieldIds = new Set<string>();
  for (const table of Object.values(schema)) {
    if (table instanceof PgAirtableTable) {
      baseIds.add(table.airtable.baseId);
      for (const fieldId of table.airtableFieldMap.values()) fieldIds.add(fieldId);
    }
  }

  return { baseIds, fieldIds };
};

const syncMarkersAcrossBases = async (date: string) => {
  const { baseIds, fieldIds } = fieldsReferencedInSchema();
  const failures: string[] = [];
  const failedFieldIds = new Set<string>();
  let consecutiveFailures = 0;
  let updated = 0;

  const tryRequest = async (label: string, request: () => Promise<unknown>) => {
    try {
      await request();
      consecutiveFailures = 0;
      return true;
    } catch (error) {
      failures.push(`${label}: ${errorMessage(error)}`);
      consecutiveFailures += 1;
      return false;
    }
  };

  const changesNeeded = (tables: AirtableTable[]): DescriptionChange[] => tables.flatMap((table) => table.fields.flatMap((field) => {
    if (failedFieldIds.has(field.id)) return [];
    const current = field.description ?? '';
    const wanted = fieldIds.has(field.id) ? addUsageMarker(current, date) : removeUsageMarker(current);
    return wanted === current ? [] : [{ table, field, description: wanted }];
  }));

  for (const baseId of baseIds) {
    for (let round = 0; round < MAX_ROUNDS_PER_BASE; round++) {
      let tables: AirtableTable[] = [];
      // eslint-disable-next-line no-await-in-loop
      await tryRequest(`list base ${baseId}`, async () => {
        ({ tables = [] } = await airtableMetaRequest<{ tables?: AirtableTable[] }>(`${baseId}/tables`));
      });
      const changes = changesNeeded(tables);
      if (changes.length === 0) break;

      for (const { table, field, description } of changes.slice(0, WRITES_PER_READ)) {
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          failures.push(`Stopped after ${MAX_CONSECUTIVE_FAILURES} consecutive failures`);
          return { updated, failures };
        }

        const path = `${baseId}/tables/${table.id}/fields/${field.id}`;
        // eslint-disable-next-line no-await-in-loop
        const ok = await tryRequest(`update ${table.name} / ${field.name}`, () => airtableMetaRequest(path, { method: 'PATCH', body: JSON.stringify({ description }) }));
        if (ok) updated += 1;
        else failedFieldIds.add(field.id);
      }
    }
  }

  return { updated, failures };
};

const isoDateToday = () => new Date().toISOString().slice(0, 10);

// Marks every field referenced in schema.ts and unmarks the rest. Never throws; failures go to Slack.
export const syncFieldUsageMarkers = async (date = isoDateToday()) => {
  let result = { updated: 0, failures: [] as string[] };
  try {
    result = await syncMarkersAcrossBases(date);
  } catch (error) {
    result.failures.push(errorMessage(error));
  }

  logger.info(`[field-usage-markers] Updated ${result.updated} field description(s), ${result.failures.length} failure(s)`);
  if (result.failures.length > 0) {
    await slackAlert(env, [`[field-usage-markers] ${result.failures.length} failure(s) syncing "used in code" markers to Airtable field descriptions:\n${result.failures.slice(0, 10).join('\n')}`]);
  }

  return result;
};
