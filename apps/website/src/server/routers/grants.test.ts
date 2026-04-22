import { describe, expect, test } from 'vitest';
import { rapidGrantTable } from '@bluedot/db';
import { createCaller, setupTestDb, testDb } from '../../__tests__/dbTestUtils';

setupTestDb();

describe('grants.getAllPublicRapidGrantees', () => {
  test('filters incomplete rows, trims fields, sanitizes links, and sorts by project title', async () => {
    await testDb.insert(rapidGrantTable, {
      granteeName: '  Alice  ', projectTitle: '  Zebra Project ', amountUsd: 5000, projectSummary: '  Useful work  ', link: ' https://example.com/zebra ',
    });
    await testDb.insert(rapidGrantTable, {
      granteeName: 'Bob', projectTitle: 'Alpha Project', amountUsd: null, projectSummary: '', link: '   ',
    });
    await testDb.insert(rapidGrantTable, {
      granteeName: 'Missing Summary', projectTitle: 'No Summary Project', amountUsd: 1000, projectSummary: '   ', link: '',
    });
    await testDb.insert(rapidGrantTable, {
      granteeName: 'Mallory', projectTitle: 'Javascript Link', amountUsd: 10, projectSummary: 'Unsafe link should be dropped', link: ['javascript', 'alert(1)'].join(':'),
    });
    await testDb.insert(rapidGrantTable, {
      granteeName: 'Eve', projectTitle: 'Mailto Link', amountUsd: 20, projectSummary: 'Unsupported protocol should be dropped', link: 'mailto:test@example.com',
    });
    await testDb.insert(rapidGrantTable, {
      granteeName: '   ', projectTitle: 'Should Drop', amountUsd: 1000, projectSummary: 'Has summary', link: '',
    });

    const caller = createCaller();
    const result = await caller.grants.getAllPublicRapidGrantees();

    expect(result).toEqual([
      {
        granteeName: 'Bob',
        projectTitle: 'Alpha Project',
        amountUsd: null,
        projectSummary: undefined,
        link: undefined,
      },
      {
        granteeName: 'Mallory',
        projectTitle: 'Javascript Link',
        amountUsd: 10,
        projectSummary: 'Unsafe link should be dropped',
        link: undefined,
      },
      {
        granteeName: 'Eve',
        projectTitle: 'Mailto Link',
        amountUsd: 20,
        projectSummary: 'Unsupported protocol should be dropped',
        link: undefined,
      },
      {
        granteeName: 'Missing Summary',
        projectTitle: 'No Summary Project',
        amountUsd: 1000,
        projectSummary: undefined,
        link: undefined,
      },
      {
        granteeName: 'Alice',
        projectTitle: 'Zebra Project',
        amountUsd: 5000,
        projectSummary: 'Useful work',
        link: 'https://example.com/zebra',
      },
    ]);
  });
});
