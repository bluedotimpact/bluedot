import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import {
  type CareerTransitionGrant, careerTransitionGrantApplicationTable, careerTransitionGrantTable, rapidGrantApplicationTable, rapidGrantTable, publishedRapidGrantTable, grantProgramStatsTable, type GrantProgramStats,
} from '@bluedot/db';
import { createCaller, setupTestDb, testDb } from '../../__tests__/dbTestUtils';

setupTestDb();

describe('grants.getAllPublicRapidGrantees', () => {
  test('filters incomplete rows, trims fields, sanitizes links, sorts dated rows newest-first then undated alphabetically, and exposes a month label', async () => {
    // Dated rows — should sort newest first.
    await testDb.insert(publishedRapidGrantTable, {
      granteeName: 'Recent Person', projectTitle: 'Recent Project', amountUsd: 5000, projectSummary: 'Recent work', link: 'https://example.com/recent', grantDate: '2026-04-15',
    });
    await testDb.insert(publishedRapidGrantTable, {
      granteeName: 'Mid Person', projectTitle: 'Mid Project', amountUsd: 3000, projectSummary: 'Mid work', link: 'https://example.com/mid', grantDate: '2026-01-02',
    });
    await testDb.insert(publishedRapidGrantTable, {
      granteeName: 'Older Person', projectTitle: 'Older Project', amountUsd: 1000, projectSummary: 'Older work', link: 'https://example.com/older', grantDate: '2025-09-20',
    });

    // Undated rows — should fall to the bottom, alphabetised.
    await testDb.insert(publishedRapidGrantTable, {
      granteeName: '  Alice  ', projectTitle: '  Zebra Project ', amountUsd: 5000, projectSummary: '  Useful work  ', link: ' https://example.com/zebra ',
    });
    await testDb.insert(publishedRapidGrantTable, {
      granteeName: 'Bob', projectTitle: 'Alpha Project', amountUsd: 0, projectSummary: '', link: '   ',
    });
    await testDb.insert(publishedRapidGrantTable, {
      granteeName: 'Missing Summary', projectTitle: 'No Summary Project', amountUsd: 1000, projectSummary: '   ', link: '',
    });
    await testDb.insert(publishedRapidGrantTable, {
      granteeName: 'Mallory', projectTitle: 'Javascript Link', amountUsd: 10, projectSummary: 'Unsafe link should be dropped', link: ['javascript', 'alert(1)'].join(':'),
    });
    await testDb.insert(publishedRapidGrantTable, {
      granteeName: 'Eve', projectTitle: 'Mailto Link', amountUsd: 20, projectSummary: 'Unsupported protocol should be dropped', link: 'mailto:test@example.com',
    });

    // Unparseable date — should be treated as undated and fall to the bottom, no monthLabel.
    await testDb.insert(publishedRapidGrantTable, {
      granteeName: 'Garbled Person', projectTitle: 'Garbled Date Project', amountUsd: 500, projectSummary: 'Garbage date', link: '', grantDate: 'not a date',
    });

    // Dropped — empty grantee name.
    await testDb.insert(publishedRapidGrantTable, {
      granteeName: '   ', projectTitle: 'Should Drop', amountUsd: 1000, projectSummary: 'Has summary', link: '',
    });

    await testDb.insert(publishedRapidGrantTable, {
      granteeName: 'Missing Amount', projectTitle: 'Unconfirmed Award', amountUsd: null,
    });
    await testDb.insert(publishedRapidGrantTable, {
      granteeName: 'Missing Title', projectTitle: '   ', amountUsd: 1000,
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
        amountUsd: 0,
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

  test('reads only the migrated feed and preserves anonymous names and pseudonyms', async () => {
    await testDb.insert(rapidGrantTable, {
      granteeName: 'Legacy Only', projectTitle: 'Old Feed', amountUsd: 1000,
    });
    await Promise.all(['Anonymous', 'Public Pseudonym'].map(async (granteeName) => {
      // The old feed remains populated during rollout but must not duplicate the new feed.
      const grant = { granteeName, projectTitle: `${granteeName} Project`, amountUsd: 500 };
      await Promise.all([testDb.insert(rapidGrantTable, grant), testDb.insert(publishedRapidGrantTable, grant)]);
    }));

    const result = await createCaller().grants.getAllPublicRapidGrantees();

    expect(result.map(({ granteeName }) => granteeName)).toEqual(['Anonymous', 'Public Pseudonym']);
  });

  test('does not fall back to legacy records when the migrated feed is empty', async () => {
    await testDb.insert(rapidGrantTable, {
      granteeName: 'Legacy Only', projectTitle: 'Old Feed', amountUsd: 1000,
    });

    expect(await createCaller().grants.getAllPublicRapidGrantees()).toEqual([]);
  });
});

describe('grants.getAllPublicCareerTransitionGrantees', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-15T11:59:59.999Z'));
    await testDb.insert(careerTransitionGrantApplicationTable, {
      id: 'eligible-application', status: 'Approve', startDate: '2026-09-01T00:00:00.000Z', publicSharing: 'Can share publicly with my name',
    });
  });

  afterEach(() => vi.useRealTimers());

  const insertPublicGrantee = (values: Partial<CareerTransitionGrant>) => testDb.insert(careerTransitionGrantTable, {
    applicationId: 'eligible-application', ...values,
  });

  test('drops rows without names or usable photos, sanitizes fields, and sorts undated grantees alphabetically', async () => {
    // Photos are required; bio and grant-plan completeness do not affect ordering.
    await insertPublicGrantee({
      firstName: 'Zoe', lastName: 'Adams', imageUrl: 'https://example.com/zoe.png https://example.com/zoe-2.png', bio: 'Engineer', grantPlan: 'Skilling up on evals', profileUrl: 'https://example.com/zoe',
    });
    await insertPublicGrantee({
      firstName: '  Amy  ', lastName: '  Baker  ', imageUrl: '  https://example.com/amy.png  ', bio: '  Researcher  ', grantPlan: '  Studying interpretability  ', profileUrl: ' https://example.com/amy ',
    });
    // Profiles with a photo remain visible even if a bio or grant plan is missing.
    await insertPublicGrantee({
      firstName: 'Ann', lastName: 'Davis', imageUrl: 'https://example.com/ann.png', bio: 'Has a bio but no plan', grantPlan: '   ',
    });
    await insertPublicGrantee({
      firstName: 'Bob', lastName: 'Carter', imageUrl: 'https://example.com/bob.png', bio: '   ', grantPlan: 'Has a plan but no bio',
    });
    await insertPublicGrantee({
      firstName: 'Cara', lastName: 'Evans',
    });
    await insertPublicGrantee({
      firstName: 'Kai', lastName: 'Foster', bio: 'Has a bio and plan but no photo', grantPlan: 'Doing safety work',
    });
    await insertPublicGrantee({
      firstName: 'Blank', lastName: 'Photo', imageUrl: '   ',
    });
    await insertPublicGrantee({
      firstName: 'Unsupported', lastName: 'Photo', imageUrl: 'ftp://example.com/photo.png',
    });
    // Dropped — missing last name.
    await insertPublicGrantee({
      firstName: 'NoLast', lastName: '   ', imageUrl: 'https://example.com/x.png', bio: 'x', grantPlan: 'y',
    });

    const caller = createCaller();
    const result = await caller.grants.getAllPublicCareerTransitionGrantees();

    expect(result.map((grantee) => grantee.granteeName)).toEqual([
      'Amy Baker',
      'Ann Davis',
      'Bob Carter',
      'Zoe Adams',
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

  test('sorts by approval date newest first, breaks ties by name, and places missing or invalid dates last', async () => {
    await insertPublicGrantee({
      imageUrl: 'https://example.com/photo.png',
      firstName: 'Alice', lastName: 'Oldest', grantApprovalDate: '2026-04-01',
      bio: 'Researcher', grantPlan: 'Safety research',
    });
    await insertPublicGrantee({
      imageUrl: 'https://example.com/photo.png',
      firstName: 'Zoe', lastName: 'Newest', grantApprovalDate: '2026-09-11',
    });
    await insertPublicGrantee({
      imageUrl: 'https://example.com/photo.png',
      firstName: 'Ben', lastName: 'SameDay', grantApprovalDate: '2026-09-11',
    });
    await insertPublicGrantee({
      imageUrl: 'https://example.com/photo.png',
      firstName: 'Middle', lastName: 'Grantee', grantApprovalDate: '2026-07-01',
    });
    await insertPublicGrantee({
      imageUrl: 'https://example.com/photo.png',
      firstName: 'Aaron', lastName: 'Undated',
    });
    await insertPublicGrantee({
      imageUrl: 'https://example.com/photo.png',
      firstName: 'Charlie', lastName: 'Invalid', grantApprovalDate: 'not-a-date',
    });
    await insertPublicGrantee({
      imageUrl: 'https://example.com/photo.png',
      firstName: 'Bob', lastName: 'Blank', grantApprovalDate: '   ',
    });

    await insertPublicGrantee({
      firstName: 'Latest', lastName: 'NoPhoto', grantApprovalDate: '2026-09-15',
    });

    const result = await createCaller().grants.getAllPublicCareerTransitionGrantees();

    expect(result.map((grantee) => grantee.granteeName)).toEqual([
      'Ben SameDay',
      'Zoe Newest',
      'Middle Grantee',
      'Alice Oldest',
      'Aaron Undated',
      'Bob Blank',
      'Charlie Invalid',
    ]);
    expect(result.every((grantee) => !('dateMs' in grantee) && !('grantApprovalDate' in grantee))).toBe(true);
  });

  test.each([null, '', 'unknown-application'])('hides grantees without a matching application (%s)', async (applicationId) => {
    await insertPublicGrantee({
      firstName: 'Private', lastName: 'Grantee', imageUrl: 'https://example.com/photo.png', applicationId,
    });
    expect(await createCaller().grants.getAllPublicCareerTransitionGrantees()).toEqual([]);
  });

  test.each([null, '', 'Can share publicly without my name', 'Cannot share publicly', 'Yes'])('requires explicit named-sharing consent (%s)', async (publicSharing) => {
    await testDb.update(careerTransitionGrantApplicationTable, { id: 'eligible-application', publicSharing });
    await insertPublicGrantee({ firstName: 'Private', lastName: 'Grantee', imageUrl: 'https://example.com/photo.png' });
    expect(await createCaller().grants.getAllPublicCareerTransitionGrantees()).toEqual([]);
  });

  test.each([null, 'TODO', 'Rejected', 'Archive'])('hides applications that are not approved (%s)', async (status) => {
    await testDb.update(careerTransitionGrantApplicationTable, { id: 'eligible-application', status });
    await insertPublicGrantee({ firstName: 'Private', lastName: 'Grantee', imageUrl: 'https://example.com/photo.png' });
    expect(await createCaller().grants.getAllPublicCareerTransitionGrantees()).toEqual([]);
  });

  test.each([null, '', 'not-a-date', '2026-02-30', '2026-02-30T00:00:00.000Z', '2026-13-01T00:00:00.000Z', '2026-2-3', '2026-09-15', '2026-09-16', '2026-09-15T00:00:00.000Z', '2026-09-16T00:00:00.000Z'])('hides missing, malformed, current and future start dates (%s)', async (startDate) => {
    await testDb.update(careerTransitionGrantApplicationTable, { id: 'eligible-application', startDate });
    await insertPublicGrantee({ firstName: 'Private', lastName: 'Grantee', imageUrl: 'https://example.com/photo.png' });
    expect(await createCaller().grants.getAllPublicCareerTransitionGrantees()).toEqual([]);
  });

  test.each(['2026-09-14', '2026-09-14T00:00:00Z', '2026-09-14T00:00:00.000Z'])('publishes only after the start day has ended everywhere, without exposing eligibility fields (%s)', async (startDate) => {
    await testDb.update(careerTransitionGrantApplicationTable, { id: 'eligible-application', startDate });
    await insertPublicGrantee({
      firstName: 'Ready', lastName: 'Grantee', imageUrl: 'https://example.com/photo.png', grantApprovalDate: '2026-09-01',
    });
    const caller = createCaller();
    expect(await caller.grants.getAllPublicCareerTransitionGrantees()).toEqual([]);

    vi.setSystemTime(new Date('2026-09-15T12:00:00.000Z'));
    expect(await caller.grants.getAllPublicCareerTransitionGrantees()).toEqual([{
      granteeName: 'Ready Grantee', imageUrl: 'https://example.com/photo.png', bio: undefined, grantPlan: undefined, profileUrl: undefined,
    }]);
  });

  test('honors withdrawn consent and postponed start dates on subsequent requests', async () => {
    await insertPublicGrantee({ firstName: 'Ready', lastName: 'Grantee', imageUrl: 'https://example.com/photo.png' });
    const caller = createCaller();
    expect(await caller.grants.getAllPublicCareerTransitionGrantees()).toHaveLength(1);

    await testDb.update(careerTransitionGrantApplicationTable, { id: 'eligible-application', publicSharing: 'Cannot share publicly' });
    expect(await caller.grants.getAllPublicCareerTransitionGrantees()).toEqual([]);

    await testDb.update(careerTransitionGrantApplicationTable, { id: 'eligible-application', publicSharing: 'Can share publicly with my name', startDate: '2026-10-01' });
    expect(await caller.grants.getAllPublicCareerTransitionGrantees()).toEqual([]);
  });
});

describe('grants.getRapidGrantStats', () => {
  const rapidId = 'recOrUgz1rbHJt40w';
  const eventsId = 'recxYhu9AmnAfP1NX';

  beforeEach(async () => {
    await Promise.all([rapidId, eventsId].map((id) => testDb.insert(grantProgramStatsTable, {
      id, approvedCount: 0, awardedAmountUsd: 0, averageDaysToDecision: null, timedDecisionCount: 0,
    })));
  });

  const updateRapid = (values: Partial<GrantProgramStats>) => testDb.update(grantProgramStatsTable, { id: rapidId, ...values });

  test('combines only RG and Events all-time aggregates, preserves cents, and weights by timed decisions rather than approvals', async () => {
    await updateRapid({
      name: 'Renamed program', approvedCount: 3, awardedAmountUsd: 15000.25, averageDaysToDecision: 2, timedDecisionCount: 10,
    });
    await testDb.update(grantProgramStatsTable, {
      id: eventsId, approvedCount: 2, awardedAmountUsd: 6000.5, averageDaysToDecision: 8, timedDecisionCount: 2,
    });
    await testDb.insert(grantProgramStatsTable, {
      name: 'Career Transition Grants', approvedCount: 100, awardedAmountUsd: 500000, averageDaysToDecision: 50, timedDecisionCount: 1000,
    });
    await testDb.insert(rapidGrantApplicationTable, {
      grantDecision: 'Accept', grantedAmountUsd: 99999, createdAt: '2026-04-01T00:00:00Z', decidedAt: '2026-04-02T00:00:00Z',
    });
    await testDb.insert(publishedRapidGrantTable, { amountUsd: 99999 });

    expect(await createCaller().grants.getRapidGrantStats()).toEqual({
      count: 5, totalAmountUsd: 21000.75, averageDaysToDecision: 3,
    });
  });

  test('includes genuine zero-day decisions in the weighted mean', async () => {
    await updateRapid({ averageDaysToDecision: 0, timedDecisionCount: 9 });
    await testDb.update(grantProgramStatsTable, { id: eventsId, averageDaysToDecision: 10, timedDecisionCount: 1 });
    expect((await createCaller().grants.getRapidGrantStats())?.averageDaysToDecision).toBe(1);
  });

  test('preserves a zero average and ignores a program with no timed decisions', async () => {
    await updateRapid({ averageDaysToDecision: 0, timedDecisionCount: 5 });
    expect((await createCaller().grants.getRapidGrantStats())?.averageDaysToDecision).toBe(0);
  });

  test('returns valid zero funding/counts and an unknown average when both programs have no timed decisions', async () => {
    expect(await createCaller().grants.getRapidGrantStats()).toEqual({
      count: 0, totalAmountUsd: 0, averageDaysToDecision: null,
    });
  });

  test.each([null, -1, 1.5])('keeps funding visible but withholds the combined average for an invalid timed-decision count (%s)', async (timedDecisionCount) => {
    await updateRapid({
      approvedCount: 1, awardedAmountUsd: 250, averageDaysToDecision: 2, timedDecisionCount,
    });
    await testDb.update(grantProgramStatsTable, { id: eventsId, averageDaysToDecision: 8, timedDecisionCount: 2 });
    expect(await createCaller().grants.getRapidGrantStats()).toEqual({
      count: 1, totalAmountUsd: 250, averageDaysToDecision: null,
    });
  });

  test.each([null, -1])('does not present a partial average when a program with timed decisions has an invalid average (%s)', async (averageDaysToDecision) => {
    await updateRapid({ averageDaysToDecision, timedDecisionCount: 10 });
    await testDb.update(grantProgramStatsTable, { id: eventsId, averageDaysToDecision: 8, timedDecisionCount: 2 });
    expect((await createCaller().grants.getRapidGrantStats())?.averageDaysToDecision).toBeNull();
  });

  test.each(['approvedCount', 'awardedAmountUsd'] as const)('does not turn a missing %s into zero', async (field) => {
    await updateRapid({ [field]: null });
    expect(await createCaller().grants.getRapidGrantStats()).toBeNull();
  });

  test('does not show partial totals or fall back to old applications when a program is missing', async () => {
    await updateRapid({ approvedCount: 1, awardedAmountUsd: 500 });
    await testDb.remove(grantProgramStatsTable, eventsId);
    await testDb.insert(rapidGrantApplicationTable, {
      grantDecision: 'Accept', grantedAmountUsd: 99999, createdAt: '2026-04-01T00:00:00Z', decidedAt: '2026-04-02T00:00:00Z',
    });
    expect(await createCaller().grants.getRapidGrantStats()).toBeNull();
    await testDb.remove(grantProgramStatsTable, rapidId);
    expect(await createCaller().grants.getRapidGrantStats()).toBeNull();
  });
});

describe('grants.getCareerTransitionGrantStats', () => {
  test('counts and sums only approved grants; averages every decided row including same-day (0) decisions', async () => {
    // "Approve" is the granted status from the applications table.
    await testDb.insert(careerTransitionGrantApplicationTable, { grantAmountUsd: 80000, status: 'Approve', timeToDecisionDays: 10 });
    await testDb.insert(careerTransitionGrantApplicationTable, { grantAmountUsd: 60000, status: 'Approve', timeToDecisionDays: 20 });
    // Rejected — excluded from count/total, but its decision time still feeds avg.
    await testDb.insert(careerTransitionGrantApplicationTable, { grantAmountUsd: 0, status: 'Rejected', timeToDecisionDays: 6 });
    // Same-day decision (0 days) — a real decided row, included in the avg.
    await testDb.insert(careerTransitionGrantApplicationTable, { grantAmountUsd: 0, status: 'Rejected', timeToDecisionDays: 0 });
    // Not yet decided — the formula is NaN until a decision date exists, stored as null — excluded from avg.
    await testDb.insert(careerTransitionGrantApplicationTable, { grantAmountUsd: null, status: 'TODO', timeToDecisionDays: null });
    // Corrupt back-fill — decision date before submission yields a negative diff; excluded from avg.
    await testDb.insert(careerTransitionGrantApplicationTable, { grantAmountUsd: 0, status: 'Rejected', timeToDecisionDays: -3 });

    const caller = createCaller();
    const result = await caller.grants.getCareerTransitionGrantStats();

    // avg over [10, 20, 6, 0] = 9
    expect(result).toEqual({ count: 2, totalAmountUsd: 140000, averageDaysToDecision: 9 });
  });

  test('returns null avg when no rows have been decided', async () => {
    await testDb.insert(careerTransitionGrantApplicationTable, { grantAmountUsd: 50000, status: 'Approve', timeToDecisionDays: null });
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
