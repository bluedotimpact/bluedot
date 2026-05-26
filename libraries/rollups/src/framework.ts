import type { PgColumn } from 'drizzle-orm/pg-core';
import type { PgAirtableColumnInput, PgAirtableDb, PgAirtableTable } from '@bluedot/db';

// A rollup value lives in Airtable but is derived from Postgres. `compute` runs a grouped query and
// returns a value for every requested id (e.g. 0 for an id with no source rows).
export type Compute = (db: PgAirtableDb, ids: string[]) => Promise<Map<string, number | null>>;

// A pgAirtable table with its column types erased, so groups can hold tables of any shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RollupTable = PgAirtableTable<string, any>;

export type RollupGroup = { table: RollupTable; fields: Record<string, Compute> };

export function rollupsFor<TColumns extends Record<string, PgAirtableColumnInput>>(
  table: PgAirtableTable<string, TColumns>,
  fields: Partial<Record<keyof TColumns & string, Compute>>,
): RollupGroup {
  return { table: table as RollupTable, fields: fields as Record<string, Compute> };
}

type Entry = { table: RollupTable; key: string; column: PgColumn; compute: Compute };

export function createRollups(db: PgAirtableDb, groups: RollupGroup[]) {
  const byColumn = new Map<PgColumn, Entry>();
  for (const { table, fields } of groups) {
    for (const [key, compute] of Object.entries(fields)) {
      const column = table.pg[key] as PgColumn;
      byColumn.set(column, {
        table, key, column, compute,
      });
    }
  }

  const write = (entry: Entry, id: string, value: number | null) => db.update(entry.table, { id, [entry.key]: value });

  // Like tRPC's invalidate: a field + id refreshes one row, a field alone every row, no argument all
  // fields. Whole-field passes skip rows whose value is already correct, so a routine run writes little.
  return {
    async invalidate(target?: { field: PgColumn; id?: string }): Promise<void> {
      if (target?.id) {
        const entry = getEntry(byColumn, target.field);
        const values = await entry.compute(db, [target.id]);
        await write(entry, target.id, values.get(target.id) ?? null);
        return;
      }

      const entries = target ? [getEntry(byColumn, target.field)] : [...byColumn.values()];
      for (const entry of entries) {
        // eslint-disable-next-line no-await-in-loop
        const current = await readCurrentValues(db, entry);
        // eslint-disable-next-line no-await-in-loop
        const computed = await entry.compute(db, [...current.keys()]);
        for (const [id, value] of computed) {
          if (value !== current.get(id)) {
            // eslint-disable-next-line no-await-in-loop
            await write(entry, id, value);
          }
        }
      }
    },
  };
}

async function readCurrentValues(db: PgAirtableDb, entry: Entry): Promise<Map<string, number | null>> {
  const rows = await db.pg.select({ id: entry.table.pg.id, value: entry.column }).from(entry.table.pg);
  return new Map(rows.map((row) => [String(row.id), (row.value ?? null) as number | null]));
}

function getEntry(byColumn: Map<PgColumn, Entry>, field: PgColumn): Entry {
  const entry = byColumn.get(field);
  if (!entry) {
    throw new Error(`No rollup defined for column ${String(field.name)}`);
  }

  return entry;
}
