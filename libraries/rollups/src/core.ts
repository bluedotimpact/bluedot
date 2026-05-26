import type { PgColumn } from 'drizzle-orm/pg-core';
import { getTableName, type PgAirtableDb, type PgAirtableTable } from '@bluedot/db';

// Values that are explicitly supported. Future devs will need to add new types as they arise in practice (e.g. arrays)
export type RollupValue = string | number | boolean | null;
export type RollupFunction = (db: PgAirtableDb, ids: string[]) => Promise<Record<string, RollupValue>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- holds a table of any shape; field keys are checked at runtime
type RollupTable = PgAirtableTable<any, any>;

export type RollupGroup = { table: RollupTable; fields: Record<string, RollupFunction> };

type Entry = { table: RollupTable; key: string; column: PgColumn; compute: RollupFunction };

// Bind rollup definitions to a db connection. The db is bound here so call sites don't repeat it.
export function bindRollups(db: PgAirtableDb, groups: RollupGroup[]) {
  const byColumn = new Map<PgColumn, Entry>();
  for (const { table, fields } of groups) {
    for (const [key, compute] of Object.entries(fields)) {
      const column = table.pg[key] as PgColumn | undefined;
      if (!column) {
        throw new Error(`Rollup field "${key}" is not a column of table "${getTableName(table.pg)}"`);
      }

      byColumn.set(column, {
        table, key, column, compute,
      });
    }
  }

  const write = (entry: Entry, id: string, value: unknown) => db.update(entry.table, { id, [entry.key]: ensureScalar(value, entry) });

  // A field + id refreshes one row, a field alone every row, no argument every field. Whole-field
  // passes skip rows whose value is unchanged.
  return {
    async invalidate(target?: { field: PgColumn; id?: string }): Promise<void> {
      if (target?.id) {
        const entry = getEntry(byColumn, target.field);
        const values = await entry.compute(db, [target.id]);
        await write(entry, target.id, values[target.id] ?? null);
        return;
      }

      const targets = target ? [getEntry(byColumn, target.field)] : [...byColumn.values()];
      for (const entry of targets) {
        // eslint-disable-next-line no-await-in-loop
        const current = await readCurrentValues(db, entry);
        // eslint-disable-next-line no-await-in-loop
        const computed = await entry.compute(db, Object.keys(current));
        for (const [id, value] of Object.entries(computed)) {
          if (value !== current[id]) {
            // eslint-disable-next-line no-await-in-loop
            await write(entry, id, value);
          }
        }
      }
    },
  };
}

function ensureScalar(value: unknown, entry: Entry): RollupValue {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  throw new Error(`Rollup for column ${String(entry.column.name)} produced a non-scalar value: ${JSON.stringify(value)}`);
}

async function readCurrentValues(db: PgAirtableDb, entry: Entry): Promise<Record<string, RollupValue>> {
  const rows = await db.pg.select({ id: entry.table.pg.id, value: entry.column }).from(entry.table.pg);
  return Object.fromEntries(rows.map((row) => [String(row.id), (row.value ?? null) as RollupValue]));
}

function getEntry(byColumn: Map<PgColumn, Entry>, field: PgColumn): Entry {
  const entry = byColumn.get(field);
  if (!entry) {
    throw new Error(`No rollup defined for column ${String(field.name)}`);
  }

  return entry;
}
