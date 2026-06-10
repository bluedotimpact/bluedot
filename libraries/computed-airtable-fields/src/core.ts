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
  beforeWrite,
}: {
  db: PgAirtableDb;
  definition: ComputedAirtableFieldDefinition;
  // Awaited before each Airtable write (basically for enforcing a rate limit)
  beforeWrite?: () => Promise<void>;
}) {
  const column = getColumn(definition);
  let checked = 0;
  let updated = 0;
  let failed = 0;
  const errors: unknown[] = [];

  const processChunk = async (rows: { id: string; current: ComputedAirtableFieldValue }[]) => {
    let computed: Record<string, ComputedAirtableFieldValue>;
    try {
      computed = await definition.compute(db, rows.map((r) => r.id));
    } catch (err) {
      // Whole chunk fails — we couldn't determine fresh values, so count every row as failed.
      errors.push(err);
      failed += rows.length;
      return;
    }

    const currentById = Object.fromEntries(rows.map((r) => [r.id, r.current]));
    const changes: { id: string; value: ComputedAirtableFieldValue }[] = [];
    for (const [id, value] of Object.entries(computed)) {
      if (value !== currentById[id]) {
        changes.push({ id, value });
      }
    }

    for (const { id, value } of changes) {
      try {
        await beforeWrite?.();
        await db.update(definition.table, { id, [definition.field]: value });
        updated += 1;
      } catch (err) {
        errors.push(err);
        failed += 1;
      }
    }
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

    await processChunk(chunk);
    checked += chunk.length;
    cursor = chunk[chunk.length - 1]!.id;
  }

  return {
    checked, updated, failed, errors,
  };
}

function getColumn(definition: ComputedAirtableFieldDefinition): PgColumn {
  const column = (definition.table.pg as Record<string, PgColumn | undefined>)[definition.field];
  if (!column) {
    throw new Error(`Computed Airtable field "${definition.field}" is not a column of table "${getTableName(definition.table.pg)}"`);
  }

  return column;
}
