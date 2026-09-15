import { teamMemberTable } from '@bluedot/db';
import { describe, expect, test } from 'vitest';
import { createCaller, setupTestDb, testDb } from '../../__tests__/dbTestUtils';

setupTestDb();

describe('teamMembers.getAll', () => {
  test('returns subteams and keeps unassigned members while excluding inactive or incomplete profiles', async () => {
    const profiles = [
      {
        name: 'Zoe', subteam: '  Courses  ', status: 'Active', imagePublicUrls: 'https://example.com/zoe.jpg',
      },
      {
        name: 'Ada', subteam: null, status: 'Active', imagePublicUrls: 'https://example.com/ada.jpg',
      },
      {
        name: 'Ben', subteam: '   ', status: 'Active', imagePublicUrls: 'https://example.com/ben.jpg',
      },
      {
        name: 'Inactive', subteam: 'Courses', status: 'Inactive', imagePublicUrls: 'https://example.com/inactive.jpg',
      },
      {
        name: 'No photo', subteam: 'Courses', status: 'Active', imagePublicUrls: null,
      },
    ];
    await Promise.all(profiles.map((profile) => testDb.insert(teamMemberTable, profile)));

    const result = await createCaller().teamMembers.getAll();

    expect(result.map(({ name, subteam }) => ({ name, subteam }))).toEqual([
      { name: 'Ada', subteam: undefined },
      { name: 'Ben', subteam: undefined },
      { name: 'Zoe', subteam: 'Courses' },
    ]);
  });
});

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
