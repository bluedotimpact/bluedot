import { describe, expect, test } from 'vitest';
import {
  careerTransitionGrantApplicationTable, careerTransitionGrantTable, oneOnOneAdvisingApplicationTable, rapidGrantApplicationTable, rapidGrantTable,
} from '@bluedot/db';
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

describe('grants.getAllPublicCareerTransitionGrantees', () => {
  test('drops nameless rows, trims and sanitizes fields, and surfaces complete cards (photo + bio + description) first, each group alphabetical', async () => {
    // Complete cards (photo, bio and grant plan) — should lead, alphabetised between themselves.
    await testDb.insert(careerTransitionGrantTable, {
      firstName: 'Zoe', lastName: 'Adams', imageUrl: 'https://example.com/zoe.png', bio: 'Engineer', grantPlan: 'Skilling up on evals', profileUrl: 'https://example.com/zoe',
    });
    await testDb.insert(careerTransitionGrantTable, {
      firstName: '  Amy  ', lastName: '  Baker  ', imageUrl: '  https://example.com/amy.png  ', bio: '  Researcher  ', grantPlan: '  Studying interpretability  ', profileUrl: ' https://example.com/amy ',
    });
    // Incomplete — each missing exactly one of photo / bio / description — should fall below, alphabetised.
    await testDb.insert(careerTransitionGrantTable, {
      firstName: 'Ann', lastName: 'Davis', imageUrl: 'https://example.com/ann.png', bio: 'Has a bio but no plan', grantPlan: '   ',
    });
    await testDb.insert(careerTransitionGrantTable, {
      firstName: 'Bob', lastName: 'Carter', imageUrl: 'https://example.com/bob.png', bio: '   ', grantPlan: 'Has a plan but no bio',
    });
    await testDb.insert(careerTransitionGrantTable, {
      firstName: 'Cara', lastName: 'Evans',
    });
    await testDb.insert(careerTransitionGrantTable, {
      firstName: 'Kai', lastName: 'Foster', bio: 'Has a bio and plan but no photo', grantPlan: 'Doing safety work',
    });
    // Dropped — missing last name.
    await testDb.insert(careerTransitionGrantTable, {
      firstName: 'NoLast', lastName: '   ', imageUrl: 'https://example.com/x.png', bio: 'x', grantPlan: 'y',
    });

    const caller = createCaller();
    const result = await caller.grants.getAllPublicCareerTransitionGrantees();

    expect(result.map((grantee) => grantee.granteeName)).toEqual([
      'Amy Baker',
      'Zoe Adams',
      'Ann Davis',
      'Bob Carter',
      'Cara Evans',
      'Kai Foster',
    ]);
    // Leading complete card has its fields trimmed and URLs sanitized.
    expect(result[0]).toEqual({
      granteeName: 'Amy Baker',
      imageUrl: 'https://example.com/amy.png',
      bio: 'Researcher',
      grantPlan: 'Studying interpretability',
      profileUrl: 'https://example.com/amy',
    });
  });
});

describe('grants.getRapidGrantStats', () => {
  const inProgram = '2026-04-01T12:00:00Z';

  test('counts accepted rows, sums their amounts, and summarises decision time across all decided rows in-program', async () => {
    // Pre-launch (2025-06-01) — entirely excluded.
    await testDb.insert(rapidGrantApplicationTable, {
      grantDecision: 'Accept', grantedAmountUsd: 9999, createdAt: '2025-05-01T00:00:00Z', decidedAt: '2025-05-02T00:00:00Z',
    });
    // In-program accepts — counted in count + totalAmountUsd + decision-time sample.
    // 24h after createdAt.
    await testDb.insert(rapidGrantApplicationTable, {
      grantDecision: 'Accept', grantedAmountUsd: 5000, createdAt: inProgram, decidedAt: '2026-04-02T12:00:00Z',
    });
    // 72h after createdAt.
    await testDb.insert(rapidGrantApplicationTable, {
      grantDecision: 'Accept', grantedAmountUsd: 2000, createdAt: inProgram, decidedAt: '2026-04-04T12:00:00Z',
    });
    // In-program rejects — excluded from count/total but their decision time still feeds the median.
    // 6h after createdAt.
    await testDb.insert(rapidGrantApplicationTable, {
      grantDecision: 'Reject', grantedAmountUsd: 0, createdAt: inProgram, decidedAt: '2026-04-01T18:00:00Z',
    });
    // 36h after createdAt.
    await testDb.insert(rapidGrantApplicationTable, {
      grantDecision: 'Reject', grantedAmountUsd: 0, createdAt: inProgram, decidedAt: '2026-04-03T00:00:00Z',
    });
    // In-program undecided — no decision yet, excluded from everything.
    await testDb.insert(rapidGrantApplicationTable, {
      grantDecision: null, createdAt: inProgram, decidedAt: null,
    });

    const caller = createCaller();
    const result = await caller.grants.getRapidGrantStats();

    // Decision hours across decided rows = [24, 36, 6, 72]. Sorted = [6, 24, 36, 72].
    // 10%-trimmed mean: floor(4 * 0.1) = 0 cut, so mean of all four = 138/4 = 34.5.
    // p90 (nearest-rank, ceil(0.9*4)-1 = 3) = 72h = 3 days.
    expect(result).toEqual({
      count: 2,
      totalAmountUsd: 7000,
      averageHoursToDecision: 34.5,
      p90DaysToDecision: 3,
    });
  });

  test('trims the fastest and slowest 10% before averaging when there are enough rows', async () => {
    // 10 decided rows with decision hours [1, 1000, 5, 6, 7, 8, 9, 10, 11, 12]. Sorted = [1, 5, 6, 7, 8, 9, 10, 11, 12, 1000].
    // 10% trim drops the fastest (1) and slowest (1000). Inner = [5,6,7,8,9,10,11,12] → mean = 8.5.
    // Without trimming the mean would be 106.9 — dominated by the outlier.
    const decisionHours = [1, 1000, 5, 6, 7, 8, 9, 10, 11, 12];
    await Promise.all(decisionHours.map((h) => testDb.insert(rapidGrantApplicationTable, {
      grantDecision: 'Reject', grantedAmountUsd: 0, createdAt: inProgram, decidedAt: new Date(new Date(inProgram).getTime() + h * 3_600_000).toISOString(),
    })));

    const caller = createCaller();
    const result = await caller.grants.getRapidGrantStats();

    expect(result.averageHoursToDecision).toBe(8.5);
  });

  test('returns null decision-time fields when no in-program rows have a valid decision delta', async () => {
    // Pre-launch — excluded.
    await testDb.insert(rapidGrantApplicationTable, {
      grantDecision: 'Accept', grantedAmountUsd: 1000, createdAt: '2025-01-01T00:00:00Z', decidedAt: '2025-01-02T00:00:00Z',
    });
    // In-program but undecided — no decidedAt.
    await testDb.insert(rapidGrantApplicationTable, {
      grantDecision: null, createdAt: inProgram, decidedAt: null,
    });
    // In-program with decidedAt before createdAt (data corruption / lastModifiedTime quirk) — excluded.
    await testDb.insert(rapidGrantApplicationTable, {
      grantDecision: 'Accept', grantedAmountUsd: 4000, createdAt: inProgram, decidedAt: '2026-03-15T00:00:00Z',
    });

    const caller = createCaller();
    const result = await caller.grants.getRapidGrantStats();

    expect(result).toEqual({
      count: 1,
      totalAmountUsd: 4000,
      averageHoursToDecision: null,
      p90DaysToDecision: null,
    });
  });

  test('returns zeros and null when the table is empty', async () => {
    const caller = createCaller();
    const result = await caller.grants.getRapidGrantStats();

    expect(result).toEqual({
      count: 0, totalAmountUsd: 0, averageHoursToDecision: null, p90DaysToDecision: null,
    });
  });
});

describe('grants.getCareerTransitionGrantStats', () => {
  test('counts and sums only Approved + Agreement signed; averages every decided row including same-day (0) decisions', async () => {
    // Granted (Approved + Agreement signed) — counted in count + totalAmountUsd.
    await testDb.insert(careerTransitionGrantApplicationTable, { grantAmountUsd: 80000, status: 'Agreement signed', timeToDecisionDays: 10 });
    await testDb.insert(careerTransitionGrantApplicationTable, { grantAmountUsd: 60000, status: 'Approved', timeToDecisionDays: 20 });
    // Rejected — excluded from count/total, but its decision time still feeds avg.
    await testDb.insert(careerTransitionGrantApplicationTable, { grantAmountUsd: 0, status: 'Rejected', timeToDecisionDays: 6 });
    // Same-day decision (0 days) — a real decided row, included in the avg.
    await testDb.insert(careerTransitionGrantApplicationTable, { grantAmountUsd: 0, status: 'Rejected', timeToDecisionDays: 0 });
    // Not yet decided — the formula is NaN until a decision date exists, stored as null — excluded from avg.
    await testDb.insert(careerTransitionGrantApplicationTable, { grantAmountUsd: null, status: 'TODO', timeToDecisionDays: null });

    const caller = createCaller();
    const result = await caller.grants.getCareerTransitionGrantStats();

    // avg over [10, 20, 6, 0] = 9
    expect(result).toEqual({ count: 2, totalAmountUsd: 140000, averageDaysToDecision: 9 });
  });

  test('returns null avg when no rows have been decided', async () => {
    await testDb.insert(careerTransitionGrantApplicationTable, { grantAmountUsd: 50000, status: 'Agreement signed', timeToDecisionDays: null });
    await testDb.insert(careerTransitionGrantApplicationTable, { grantAmountUsd: null, status: 'TODO', timeToDecisionDays: null });

    const caller = createCaller();
    const result = await caller.grants.getCareerTransitionGrantStats();

    expect(result).toEqual({ count: 1, totalAmountUsd: 50000, averageDaysToDecision: null });
  });

  test('returns zeros and null when the table is empty', async () => {
    const caller = createCaller();
    const result = await caller.grants.getCareerTransitionGrantStats();

    expect(result).toEqual({ count: 0, totalAmountUsd: 0, averageDaysToDecision: null });
  });
});

describe('grants.getOneOnOneAdvisingStats', () => {
  test('averages every decided application including same-day (0) decisions, excluding undecided (null) rows', async () => {
    await testDb.insert(oneOnOneAdvisingApplicationTable, { timeToDecisionDays: 4 });
    await testDb.insert(oneOnOneAdvisingApplicationTable, { timeToDecisionDays: 2 });
    // Same-day decision (0 days) — a real decided application, included in the avg.
    await testDb.insert(oneOnOneAdvisingApplicationTable, { timeToDecisionDays: 0 });
    // Not yet decided — the formula is NaN until a decision date exists, stored as null.
    await testDb.insert(oneOnOneAdvisingApplicationTable, { timeToDecisionDays: null });
    // Corrupt back-fill — decision date before submission yields a negative diff; excluded.
    await testDb.insert(oneOnOneAdvisingApplicationTable, { timeToDecisionDays: -3 });

    const caller = createCaller();
    const result = await caller.grants.getOneOnOneAdvisingStats();

    // avg over [4, 2, 0] = 2
    expect(result).toEqual({ averageDaysToDecision: 2 });
  });

  test('returns null when no applications have been decided', async () => {
    await testDb.insert(oneOnOneAdvisingApplicationTable, { timeToDecisionDays: null });

    const caller = createCaller();
    const result = await caller.grants.getOneOnOneAdvisingStats();

    expect(result).toEqual({ averageDaysToDecision: null });
  });

  test('returns null when the table is empty', async () => {
    const caller = createCaller();
    const result = await caller.grants.getOneOnOneAdvisingStats();

    expect(result).toEqual({ averageDaysToDecision: null });
  });
});
