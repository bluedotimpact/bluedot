import { text } from 'drizzle-orm/pg-core';
import { describe, expect, test } from 'vitest';
import { PgAirtableTable } from './db-core';

describe('PgAirtableTable', () => {
  test('throws if deprecated column uses notNull', () => {
    expect(() => new PgAirtableTable('test', {
      baseId: 'base',
      tableId: 'table',
      columns: {},
      deprecatedColumns: {
        badCol: { pgColumn: text().notNull(), airtableId: 'fld123', deprecated: true },
      },
    })).toThrow(/must be nullable/);
  });

  test('creates pgWithDeprecatedColumns when deprecated columns exist', () => {
    const table = new PgAirtableTable('test', {
      baseId: 'base',
      tableId: 'table',
      columns: { active: { pgColumn: text(), airtableId: 'fld1' } },
      deprecatedColumns: { old: { pgColumn: text(), airtableId: 'fld2', deprecated: true } },
    });
    expect(table.pgWithDeprecatedColumns).toBeDefined();
  });
});
