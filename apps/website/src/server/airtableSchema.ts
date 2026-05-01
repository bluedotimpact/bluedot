import env from '../lib/api/env';
import { ONE_MINUTE_MS } from '../lib/constants';

const CACHE_TTL_MS = 5 * ONE_MINUTE_MS;

export type FieldOption = { id: string; name: string };

type AirtableMetaField = {
  id: string;
  name: string;
  type: string;
  options?: {
    choices?: { id: string; name: string }[];
  };
};

type AirtableMetaTable = {
  id: string;
  name: string;
  fields: AirtableMetaField[];
};

type AirtableMetaResponse = {
  tables: AirtableMetaTable[];
};

type CacheEntry = {
  value: FieldOption[];
  timestamp: number;
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<FieldOption[]>>();
const refreshing = new Set<string>();

const cacheKey = (baseId: string, tableId: string, fieldId: string) => `${baseId}:${tableId}:${fieldId}`;

async function fetchFieldOptions(baseId: string, tableId: string, fieldId: string): Promise<FieldOption[]> {
  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: {
      Authorization: `Bearer ${env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Airtable Meta API returned ${response.status}: ${response.statusText}`);
  }
  const data = await response.json() as AirtableMetaResponse;
  const table = data.tables.find((t) => t.id === tableId);
  if (!table) {
    throw new Error(`Table ${tableId} not found in base ${baseId}`);
  }
  const field = table.fields.find((f) => f.id === fieldId);
  if (!field) {
    throw new Error(`Field ${fieldId} not found in table ${tableId}`);
  }
  const choices = field.options?.choices;
  if (!choices) {
    throw new Error(`Field ${fieldId} has no choices (type: ${field.type})`);
  }
  return choices.map(({ id, name }) => ({ id, name }));
}

async function refresh(key: string, baseId: string, tableId: string, fieldId: string): Promise<FieldOption[]> {
  refreshing.add(key);
  try {
    const value = await fetchFieldOptions(baseId, tableId, fieldId);
    cache.set(key, { value, timestamp: Date.now() });
    return value;
  } finally {
    refreshing.delete(key);
  }
}

export async function getFieldOptions(baseId: string, tableId: string, fieldId: string): Promise<FieldOption[]> {
  const key = cacheKey(baseId, tableId, fieldId);
  const entry = cache.get(key);
  const now = Date.now();

  if (entry && now - entry.timestamp < CACHE_TTL_MS) {
    return entry.value;
  }

  if (entry) {
    if (!refreshing.has(key)) {
      refresh(key, baseId, tableId, fieldId).catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`Background refresh failed for ${key}:`, err);
      });
    }
    return entry.value;
  }

  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = refresh(key, baseId, tableId, fieldId);
  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}
