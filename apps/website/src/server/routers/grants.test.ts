import { describe, expect, test } from 'vitest';
import { grantTable } from '@bluedot/db';
import { createCaller, setupTestDb, testDb } from '../../__tests__/dbTestUtils';

setupTestDb();

describe('grants.getAllPublicGrantees', () => {
  test('filters incomplete rows, trims fields, sanitizes links, and sorts by project title', async () => {
    await testDb.insert(grantTable, {
      granteeName: '  Alice  ', projectTitle: '  Zebra Project ', amountUsd: 5000, projectSummary: '  Useful work  ', link: ' https://example.com/zebra ',
    });
    await testDb.insert(grantTable, {
      granteeName: 'Bob', projectTitle: 'Alpha Project', amountUsd: null, projectSummary: '', link: '   ',
    });
    await testDb.insert(grantTable, {
      granteeName: 'Missing Summary', projectTitle: 'No Summary Project', amountUsd: 1000, projectSummary: '   ', link: '',
    });
    await testDb.insert(grantTable, {
      granteeName: 'Mallory', projectTitle: 'Javascript Link', amountUsd: 10, projectSummary: 'Unsafe link should be dropped', link: ['javascript', 'alert(1)'].join(':'),
    });
    await testDb.insert(grantTable, {
      granteeName: 'Eve', projectTitle: 'Mailto Link', amountUsd: 20, projectSummary: 'Unsupported protocol should be dropped', link: 'mailto:test@example.com',
    });
    await testDb.insert(grantTable, {
      granteeName: '   ', projectTitle: 'Should Drop', amountUsd: 1000, projectSummary: 'Has summary', link: '',
    });

    const caller = createCaller();
    const result = await caller.grants.getAllPublicGrantees();

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
