import { teamMemberTable } from '@bluedot/db';
import { describe, expect, test } from 'vitest';
import { createCaller, setupTestDb, testDb } from '../../__tests__/dbTestUtils';

setupTestDb();

describe('teamMembers.getOneOnOneAdvisors', () => {
  test('returns advisor profile descriptions for active 1-1 advisors', async () => {
    await testDb.insert(teamMemberTable, {
      name: 'Zoe Advisor',
      jobTitle: 'Strategy advisor',
      imagePublicUrls: 'https://example.com/zoe.jpg',
      status: 'Active',
      isOneOnOneAdvisor: true,
      advisorProfileDescription: 'Useful to talk to about operations and strategy roles.',
    });
    await testDb.insert(teamMemberTable, {
      name: 'Ada Advisor',
      jobTitle: 'Governance advisor',
      imagePublicUrls: 'https://example.com/ada.jpg',
      status: 'Active',
      isOneOnOneAdvisor: true,
      advisorProfileDescription: '   ',
    });
    await testDb.insert(teamMemberTable, {
      name: 'Hidden Person',
      jobTitle: 'Not an advisor',
      imagePublicUrls: 'https://example.com/hidden.jpg',
      status: 'Active',
      isOneOnOneAdvisor: false,
      advisorProfileDescription: 'This should not be returned.',
    });

    const result = await createCaller().teamMembers.getOneOnOneAdvisors();

    expect(result).toEqual([
      {
        name: 'Ada Advisor',
        jobTitle: 'Governance advisor',
        imageUrl: 'https://example.com/ada.jpg',
        url: undefined,
        advisorProfileDescription: undefined,
      },
      {
        name: 'Zoe Advisor',
        jobTitle: 'Strategy advisor',
        imageUrl: 'https://example.com/zoe.jpg',
        url: undefined,
        advisorProfileDescription: 'Useful to talk to about operations and strategy roles.',
      },
    ]);
  });
});
