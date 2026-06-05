/* eslint-disable no-await-in-loop */
import {
  asc, gt, getTableName, type PgAirtableDb, type PgAirtableTable,
} from '@bluedot/db';
import type { PgColumn } from 'drizzle-orm/pg-core';

export type ComputedAirtableFieldValue = string | number | boolean | null;

type ComputeFn = (db: PgAirtableDb, targetIds: string[]) => Promise<Record<string, ComputedAirtableFieldValue>>;

export type ComputedAirtableFieldDefinition = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: PgAirtableTable<any, any>;
  field: string;
  compute: ComputeFn;
};

export type ComputedAirtableFieldGroup = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: PgAirtableTable<any, any>;
  fields: Record<string, ComputeFn>;
};

const COMPUTE_CHUNK_SIZE = 500;

export async function recomputeValues({
  db,
  definition,
}: {
  db: PgAirtableDb;
  definition: ComputedAirtableFieldDefinition;
}) {
  const column = getColumn(definition);
  let checked = 0;
  let updated = 0;

  const processChunk = async (rows: { id: string; current: ComputedAirtableFieldValue }[]) => {
    // Step 1: Compute fresh values
    const computed = await definition.compute(db, rows.map((r) => r.id));

    // Step 2: Diff against current values
    const currentById = Object.fromEntries(rows.map((r) => [r.id, r.current]));
    const changes: { id: string; value: ComputedAirtableFieldValue }[] = [];
    for (const [id, value] of Object.entries(computed)) {
      if (value !== currentById[id]) {
        changes.push({ id, value });
      }
    }

    // Step 3: Push only changed values
    for (const { id, value } of changes) {
      await db.update(definition.table, { id, [definition.field]: value });
    }

    return changes.length;
  };

  // Paginate by id so we never hold the whole table in memory
  let cursor: string | null = null;
  while (true) {
    const idColumn = definition.table.pg.id;

    const rows = await db.pg
      .select({ id: idColumn, value: column })
      .from(definition.table.pg)
      .where(cursor === null ? undefined : gt(idColumn, cursor))
      .orderBy(asc(idColumn))
      .limit(COMPUTE_CHUNK_SIZE);

    if (rows.length === 0) break;

    const chunk = rows.map((row) => ({
      id: String(row.id),
      current: (row.value ?? null) as ComputedAirtableFieldValue,
    }));

    updated += await processChunk(chunk);
    checked += chunk.length;
    cursor = chunk[chunk.length - 1]!.id;
  }

  return { checked, updated };
}

function getColumn(definition: ComputedAirtableFieldDefinition): PgColumn {
  const column = (definition.table.pg as Record<string, PgColumn | undefined>)[definition.field];
  if (!column) {
    throw new Error(`Computed Airtable field "${definition.field}" is not a column of table "${getTableName(definition.table.pg)}"`);
  }

  return column;
}
