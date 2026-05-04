import env from '../lib/api/env';
import { ONE_MINUTE_MS } from '../lib/constants';

const CACHE_TTL_MS = 5 * ONE_MINUTE_MS;

export type FieldOption = { id: string; name: string };

type AirtableMetaResponse = {
  tables: {
    id: string;
    fields: {
      id: string;
      name: string;
      type: string;
      options?: { choices?: { id: string; name: string }[] };
    }[];
  }[];
};

const cache = new Map<string, { value: FieldOption[]; timestamp: number }>();
const cacheKey = (baseId: string, tableId: string, fieldId: string) => `${baseId}:${tableId}:${fieldId}`;

async function fetchFieldOptions(baseId: string, tableId: string, fieldId: string): Promise<FieldOption[]> {
  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${env.AIRTABLE_PERSONAL_ACCESS_TOKEN}` },
  });
  if (!response.ok) {
    throw new Error(`Airtable Meta API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json() as AirtableMetaResponse;
  const field = data.tables.find((t) => t.id === tableId)?.fields.find((f) => f.id === fieldId);
  if (!field) throw new Error(`Field ${fieldId} not found in table ${tableId}`);
  if (!field.options?.choices) throw new Error(`Field ${fieldId} has no choices (type: ${field.type})`);
  return field.options.choices.map(({ id, name }) => ({ id, name }));
}

async function refresh(key: string, baseId: string, tableId: string, fieldId: string): Promise<FieldOption[]> {
  const value = await fetchFieldOptions(baseId, tableId, fieldId);
  cache.set(key, { value, timestamp: Date.now() });
  return value;
}

// Stale-while-revalidate: serve cached value within TTL; if stale, return cached and refresh in background;
// only block on cold start.
export async function getFieldOptions(baseId: string, tableId: string, fieldId: string): Promise<FieldOption[]> {
  const key = cacheKey(baseId, tableId, fieldId);
  const entry = cache.get(key);

  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.value;
  }

  if (entry) {
    refresh(key, baseId, tableId, fieldId).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error(`Background refresh failed for ${key}:`, err);
    });
    return entry.value;
  }

  return refresh(key, baseId, tableId, fieldId);
}
