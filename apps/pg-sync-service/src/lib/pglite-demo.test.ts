import { describe, expect, test } from 'vitest';
import { eq, metaTable, courseTable } from '@bluedot/db';
import { db } from './db';

describe('PGlite demo', () => {
  test('metaTable is populated by ensureSchemaUpToDate', async () => {
    // ensureSchemaUpToDate (called in vitest.setup.ts) runs syncFields which
    // populates metaTable with field mappings for all PgAirtableTables
    const results = await db.pg.select().from(metaTable).where(eq(metaTable.pgTable, 'course'));
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatchObject({
      pgTable: 'course',
    });
  });

  test('can insert and query a PgAirtableTable', async () => {
    await db.pg.insert(courseTable.pg).values({
      id: 'recABC123',
      title: 'Test Course',
      slug: 'test-course',
      path: '/test-course',
      description: 'A test course',
      shortDescription: 'Test',
      units: ['unit1'],
    });

    const results = await db.pg.select().from(courseTable.pg).where(eq(courseTable.pg.id, 'recABC123'));
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 'recABC123',
      title: 'Test Course',
      slug: 'test-course',
    });
  });
});
