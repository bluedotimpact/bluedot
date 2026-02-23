import { text } from 'drizzle-orm/pg-core';
import { describe, expect, test } from 'vitest';
import { PgAirtableTable } from './db-core';

describe('PgAirtableTable', () => {
  test('creates pgWithDeprecatedColumns when deprecated columns exist', () => {
    const table = new PgAirtableTable('test', {
      baseId: 'base',
      tableId: 'table',
      columns: { active: { pgColumn: text(), airtableId: 'fld1' } },
      deprecatedColumns: { old: { pgColumn: text(), airtableId: 'fld2', deprecated: true } },
    });
    expect(table.pgWithDeprecatedColumns).toBeDefined();
  });

  test('throws if column appears in both columns and deprecatedColumns', () => {
    expect(() => new PgAirtableTable('test', {
      baseId: 'base',
      tableId: 'table',
      columns: { duplicateCol: { pgColumn: text(), airtableId: 'fld1' } },
      deprecatedColumns: { duplicateCol: { pgColumn: text(), airtableId: 'fld2', deprecated: true } },
    })).toThrow(/appears in both columns and deprecatedColumns/);
  });
});
