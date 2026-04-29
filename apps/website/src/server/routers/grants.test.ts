import { describe, expect, test } from 'vitest';
import { rapidGrantTable } from '@bluedot/db';
import { createCaller, setupTestDb, testDb } from '../../__tests__/dbTestUtils';

setupTestDb();

describe('grants.getAllPublicRapidGrantees', () => {
  test('filters incomplete rows, trims fields, sanitizes links, sorts dated rows newest-first then undated alphabetically, and exposes a month label', async () => {
    // Dated rows — should sort newest first.
    await testDb.insert(rapidGrantTable, {
      granteeName: 'Recent Person', projectTitle: 'Recent Project', amountUsd: 5000, projectSummary: 'Recent work', link: 'https://example.com/recent', grantDate: '2026-04-15',
    });
    await testDb.insert(rapidGrantTable, {
      granteeName: 'Mid Person', projectTitle: 'Mid Project', amountUsd: 3000, projectSummary: 'Mid work', link: 'https://example.com/mid', grantDate: '2026-01-02',
    });
    await testDb.insert(rapidGrantTable, {
      granteeName: 'Older Person', projectTitle: 'Older Project', amountUsd: 1000, projectSummary: 'Older work', link: 'https://example.com/older', grantDate: '2025-09-20',
    });

    // Undated rows — should fall to the bottom, alphabetised.
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

    // Unparseable date — should be treated as undated and fall to the bottom, no monthLabel.
    await testDb.insert(rapidGrantTable, {
      granteeName: 'Garbled Person', projectTitle: 'Garbled Date Project', amountUsd: 500, projectSummary: 'Garbage date', link: '', grantDate: 'not a date',
    });

    // Dropped — empty grantee name.
    await testDb.insert(rapidGrantTable, {
      granteeName: '   ', projectTitle: 'Should Drop', amountUsd: 1000, projectSummary: 'Has summary', link: '',
    });

    const caller = createCaller();
    const result = await caller.grants.getAllPublicRapidGrantees();

    expect(result).toEqual([
      // Dated rows, newest first.
      {
        granteeName: 'Recent Person',
        projectTitle: 'Recent Project',
        amountUsd: 5000,
        projectSummary: 'Recent work',
        link: 'https://example.com/recent',
        monthLabel: 'Apr 2026',
      },
      {
        granteeName: 'Mid Person',
        projectTitle: 'Mid Project',
        amountUsd: 3000,
        projectSummary: 'Mid work',
        link: 'https://example.com/mid',
        monthLabel: 'Jan 2026',
      },
      {
        granteeName: 'Older Person',
        projectTitle: 'Older Project',
        amountUsd: 1000,
        projectSummary: 'Older work',
        link: 'https://example.com/older',
        monthLabel: 'Sep 2025',
      },
      // Undated rows, alphabetised by project title.
      {
        granteeName: 'Bob',
        projectTitle: 'Alpha Project',
        amountUsd: null,
        projectSummary: undefined,
        link: undefined,
        monthLabel: undefined,
      },
      {
        granteeName: 'Garbled Person',
        projectTitle: 'Garbled Date Project',
        amountUsd: 500,
        projectSummary: 'Garbage date',
        link: undefined,
        monthLabel: undefined,
      },
      {
        granteeName: 'Mallory',
        projectTitle: 'Javascript Link',
        amountUsd: 10,
        projectSummary: 'Unsafe link should be dropped',
        link: undefined,
        monthLabel: undefined,
      },
      {
        granteeName: 'Eve',
        projectTitle: 'Mailto Link',
        amountUsd: 20,
        projectSummary: 'Unsupported protocol should be dropped',
        link: undefined,
        monthLabel: undefined,
      },
      {
        granteeName: 'Missing Summary',
        projectTitle: 'No Summary Project',
        amountUsd: 1000,
        projectSummary: undefined,
        link: undefined,
        monthLabel: undefined,
      },
      {
        granteeName: 'Alice',
        projectTitle: 'Zebra Project',
        amountUsd: 5000,
        projectSummary: 'Useful work',
        link: 'https://example.com/zebra',
        monthLabel: undefined,
      },
    ]);
  });
});
