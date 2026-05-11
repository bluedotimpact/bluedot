import { describe, expect, test } from 'vitest';
import { jobPostingTable } from '@bluedot/db';
import { createCaller, setupTestDb, testDb } from '../../__tests__/dbTestUtils';

setupTestDb();

describe('jobs.getAll', () => {
  test('sorts by Airtable Prio (1 Top → 2 Med → 3 Low), falls back to title, and pushes null-priority jobs to the bottom', async () => {
    // Order of inserts is deliberately scrambled to ensure the router does the sorting.
    await testDb.insert(jobPostingTable, {
      title: 'Beta', slug: 'beta', priority: '2 Med', publicationStatus: 'Published',
    });
    await testDb.insert(jobPostingTable, {
      title: 'Zeta', slug: 'zeta', priority: null, publicationStatus: 'Published',
    });
    await testDb.insert(jobPostingTable, {
      title: 'Alpha', slug: 'alpha', priority: '1 Top', publicationStatus: 'Published',
    });
    await testDb.insert(jobPostingTable, {
      title: 'Charlie', slug: 'charlie', priority: '2 Med', publicationStatus: 'Published',
    });
    await testDb.insert(jobPostingTable, {
      title: 'Delta', slug: 'delta', priority: '3 Low', publicationStatus: 'Published',
    });
    await testDb.insert(jobPostingTable, {
      title: 'Aardvark', slug: 'aardvark', priority: null, publicationStatus: 'Published',
    });

    // Unpublished jobs should never appear.
    await testDb.insert(jobPostingTable, {
      title: 'Hidden', slug: 'hidden', priority: '1 Top', publicationStatus: 'Unpublished',
    });

    const caller = createCaller();
    const result = await caller.jobs.getAll();

    expect(result.map((j) => j.slug)).toEqual([
      'alpha', // 1 Top
      'beta', // 2 Med, title-alphabetical with charlie
      'charlie', // 2 Med
      'delta', // 3 Low
      'aardvark', // null, title-alphabetical with zeta
      'zeta', // null
    ]);
  });
});
