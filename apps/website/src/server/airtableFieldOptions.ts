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

type Tables = AirtableMetaResponse['tables'];

// The Meta API returns the entire base schema regardless of which field we want, so we cache by baseId
// and share the response across all (table, field) lookups in that base.
const cache = new Map<string, { value: Tables; timestamp: number }>();

async function fetchBaseSchema(baseId: string): Promise<Tables> {
  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${env.AIRTABLE_PERSONAL_ACCESS_TOKEN}` },
  });
  if (!response.ok) {
    throw new Error(`Airtable Meta API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json() as AirtableMetaResponse;
  return data.tables;
}

async function refresh(baseId: string): Promise<Tables> {
  const value = await fetchBaseSchema(baseId);
  cache.set(baseId, { value, timestamp: Date.now() });
  return value;
}

// Stale-while-revalidate: serve cached value within TTL; if stale, return cached and refresh in background;
// only block on cold start.
async function getBaseSchema(baseId: string): Promise<Tables> {
  const entry = cache.get(baseId);

  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.value;
  }

  if (entry) {
    refresh(baseId).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error(`Background refresh failed for ${baseId}:`, err);
    });
    return entry.value;
  }

  return refresh(baseId);
}

export async function getFieldOptions(baseId: string, tableId: string, fieldId: string): Promise<FieldOption[]> {
  const tables = await getBaseSchema(baseId);
  const field = tables.find((t) => t.id === tableId)?.fields.find((f) => f.id === fieldId);

  if (!field) throw new Error(`Field ${fieldId} not found in table ${tableId}`);
  if (!field.options?.choices) throw new Error(`Field ${fieldId} has no choices (type: ${field.type})`);

  return field.options.choices.map(({ id, name }) => ({ id, name }));
}
