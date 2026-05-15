import { describe, expect, test } from 'vitest';
import { programTable } from '@bluedot/db';
import { createCaller, setupTestDb, testDb } from '../../__tests__/dbTestUtils';

setupTestDb();

describe('programs.getBySlug', () => {
  test('returns a Draft program — status filter is intentionally bypassed for detail-page lookups', async () => {
    await testDb.insert(programTable, {
      name: 'Fieldbuilder Week',
      slug: 'fieldbuilder-week',
      status: 'Draft',
      applicationForm: 'https://example.com/fieldbuilder-week',
    });

    const caller = createCaller();
    const result = await caller.programs.getBySlug({ slug: 'fieldbuilder-week' });

    expect(result?.slug).toBe('fieldbuilder-week');
    expect(result?.applicationForm).toBe('https://example.com/fieldbuilder-week');
  });

  test('returns null when no program matches the slug', async () => {
    const caller = createCaller();
    const result = await caller.programs.getBySlug({ slug: 'does-not-exist' });

    expect(result).toBeNull();
  });
});

describe('programs.getAll', () => {
  test('excludes non-Active programs — locks down the listing-vs-detail contract divergence', async () => {
    await testDb.insert(programTable, {
      name: 'Active One', slug: 'active-one', status: 'Active',
    });
    await testDb.insert(programTable, {
      name: 'Draft One', slug: 'draft-one', status: 'Draft',
    });

    const caller = createCaller();
    const result = await caller.programs.getAll();

    expect(result.map((p) => p.slug)).toEqual(['active-one']);
  });
});
