import { getTableConfig, index, text } from 'drizzle-orm/pg-core';
import { describe, expect, test } from 'vitest';
import { PgAirtableTable, DeprecationSafePgTable } from './db-core';

const indexNames = (table: Parameters<typeof getTableConfig>[0]) => getTableConfig(table).indexes.map((i) => i.config.name);

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

  test('throws if column appears in both columns and deprecatedColumns', () => {
    expect(() => new PgAirtableTable('test', {
      baseId: 'base',
      tableId: 'table',
      columns: { duplicateCol: { pgColumn: text(), airtableId: 'fld1' } },
      deprecatedColumns: { duplicateCol: { pgColumn: text(), airtableId: 'fld2', deprecated: true } },
    })).toThrow(/appears in both columns and deprecatedColumns/);
  });

  test('applies indexes to both pg and pgWithDeprecatedColumns', () => {
    const table = new PgAirtableTable('test', {
      baseId: 'base',
      tableId: 'table',
      columns: { active: { pgColumn: text(), airtableId: 'fld1' } },
      deprecatedColumns: { old: { pgColumn: text(), airtableId: 'fld2', deprecated: true } },
      indexes: (t) => [index('test_active_idx').on(t.active)],
    });
    expect(indexNames(table.pg)).toEqual(['test_active_idx']);
    expect(indexNames(table.pgWithDeprecatedColumns!)).toEqual(['test_active_idx']);
  });
});

describe('DeprecationSafePgTable', () => {
  test('has no pgWithDeprecatedColumns when there are no deprecated columns', () => {
    const table = new DeprecationSafePgTable('test', {
      columns: { active: text() },
    });
    expect(table.pg).toBeDefined();
    expect(table.pgWithDeprecatedColumns).toBeUndefined();
  });

  test('throws if deprecated column uses notNull', () => {
    expect(() => new DeprecationSafePgTable('test', {
      columns: { active: text() },
      deprecatedColumns: { badCol: text().notNull() },
    })).toThrow(/must be nullable/);
  });

  test('creates pgWithDeprecatedColumns when deprecated columns exist', () => {
    const table = new DeprecationSafePgTable('test', {
      columns: { active: text() },
      deprecatedColumns: { old: text() },
    });
    expect(table.pgWithDeprecatedColumns).toBeDefined();
  });

  test('throws if column appears in both columns and deprecatedColumns', () => {
    expect(() => new DeprecationSafePgTable('test', {
      columns: { duplicateCol: text() },
      deprecatedColumns: { duplicateCol: text() },
    })).toThrow(/appears in both columns and deprecatedColumns/);
  });

  test('applies indexes to both pg and pgWithDeprecatedColumns', () => {
    const table = new DeprecationSafePgTable('test', {
      columns: { tags: text().array() },
      deprecatedColumns: { old: text() },
      indexes: (t) => [index('test_tags_idx').using('gin', t.tags)],
    });
    expect(indexNames(table.pg)).toEqual(['test_tags_idx']);
    expect(indexNames(table.pgWithDeprecatedColumns!)).toEqual(['test_tags_idx']);
  });
});
