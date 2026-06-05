import {
  getTableName, type PgAirtableDb, type PgAirtableTable,
} from '@bluedot/db';
import type { PgColumn } from 'drizzle-orm/pg-core';

export type ComputedAirtableFieldValue = string | number | boolean | null;

export type ComputeFieldValues = (
  db: PgAirtableDb,
  targetIds: string[],
) => Promise<Record<string, ComputedAirtableFieldValue>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- definitions can target any pgAirtable table
export type ComputedAirtableFieldTable = PgAirtableTable<any, any>;

export type ComputedAirtableFieldDefinition = {
  table: ComputedAirtableFieldTable;
  field: string;
  compute: ComputeFieldValues;
};

export type RecomputeResult = {
  table: string;
  field: string;
  checked: number;
  updated: number;
};

export async function recomputeFieldsAndSyncToAirtable({
  db,
  definitions,
}: {
  db: PgAirtableDb;
  definitions: ComputedAirtableFieldDefinition[];
}): Promise<RecomputeResult[]> {
  const results: RecomputeResult[] = [];

  for (const definition of definitions) {
    // Airtable writes are slow and rate-limited, so process definitions sequentially.
    // eslint-disable-next-line no-await-in-loop
    results.push(await recomputeDefinition({ db, definition }));
  }

  return results;
}

async function recomputeDefinition({
  db,
  definition,
}: {
  db: PgAirtableDb;
  definition: ComputedAirtableFieldDefinition;
}): Promise<RecomputeResult> {
  const column = getColumn(definition);
  const currentValues = await readCurrentValues(db, definition, column);
  const computedValues = await definition.compute(db, Object.keys(currentValues));
  let updated = 0;

  for (const [id, rawValue] of Object.entries(computedValues)) {
    const value = ensureSupportedValue(rawValue, definition);
    if (value !== currentValues[id]) {
      updated += 1;
      // eslint-disable-next-line no-await-in-loop
      await db.update(definition.table, { id, [definition.field]: value });
    }
  }

  return {
    table: getTableName(definition.table.pg),
    field: definition.field,
    checked: Object.keys(currentValues).length,
    updated,
  };
}

async function readCurrentValues(
  db: PgAirtableDb,
  definition: ComputedAirtableFieldDefinition,
  column: PgColumn,
): Promise<Record<string, ComputedAirtableFieldValue>> {
  const rows = await db.pg
    .select({ id: definition.table.pg.id, value: column })
    .from(definition.table.pg);

  return Object.fromEntries(rows.map((row) => [
    String(row.id),
    (row.value ?? null) as ComputedAirtableFieldValue,
  ]));
}

function getColumn(definition: ComputedAirtableFieldDefinition): PgColumn {
  const column = (definition.table.pg as Record<string, PgColumn | undefined>)[definition.field];
  if (!column) {
    throw new Error(`Computed Airtable field "${definition.field}" is not a column of table "${getTableName(definition.table.pg)}"`);
  }

  return column;
}

function ensureSupportedValue(
  value: unknown,
  definition: ComputedAirtableFieldDefinition,
): ComputedAirtableFieldValue {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  throw new Error(`Computed Airtable field "${getTableName(definition.table.pg)}.${definition.field}" produced an unsupported value: ${JSON.stringify(value)}`);
}
