import { describe, expect, test } from 'vitest';
import type { FacilitatorApplicationListItem } from '../../server/routers/facilitator-applications';
import { filterByTab, getPillVariant, isApplicationTab } from './applicationTabs';

const baseApp = (overrides: Partial<FacilitatorApplicationListItem>): FacilitatorApplicationListItem => ({
  id: 'reg-1',
  courseId: 'course-1',
  courseTitle: 'Course',
  courseSlug: 'course',
  roundId: 'round-1',
  roundName: 'Week 1',
  roundFirstDiscussionDate: null,
  roundLastDiscussionDate: null,
  decision: null,
  roundStatus: 'Future',
  hasAvailability: false,
  ...overrides,
});

describe('isApplicationTab', () => {
  test('accepts known tab ids', () => {
    expect(isApplicationTab('active')).toBe(true);
    expect(isApplicationTab('past')).toBe(true);
  });
  test('rejects unknown values', () => {
    expect(isApplicationTab('foo')).toBe(false);
    expect(isApplicationTab(undefined)).toBe(false);
  });
});

describe('getPillVariant', () => {
  test('Withdrawn decision → withdrawn pill', () => {
    expect(getPillVariant(baseApp({ decision: 'Withdrawn' }))).toBe('withdrawn');
  });
  test('Accept decision on in-flight round → accepted pill', () => {
    expect(getPillVariant(baseApp({ decision: 'Accept', roundStatus: 'Future' }))).toBe('accepted');
    expect(getPillVariant(baseApp({ decision: 'Accept', roundStatus: 'Active' }))).toBe('accepted');
  });
  test('Accept decision on past round → pastAccepted pill', () => {
    expect(getPillVariant(baseApp({ decision: 'Accept', roundStatus: 'Past' }))).toBe('pastAccepted');
  });
  test('Reject decision → notPlaced pill', () => {
    expect(getPillVariant(baseApp({ decision: 'Reject' }))).toBe('notPlaced');
  });
  test('null decision → pending pill', () => {
    expect(getPillVariant(baseApp({ decision: null }))).toBe('pending');
  });
});

describe('filterByTab', () => {
  const accepted = baseApp({ id: 'a', decision: 'Accept', roundStatus: 'Future' });
  const pending = baseApp({ id: 'p', decision: null, roundStatus: 'Future' });
  const activeAccepted = baseApp({ id: 'aa', decision: 'Accept', roundStatus: 'Active' });
  const pastAccepted = baseApp({ id: 'pa', decision: 'Accept', roundStatus: 'Past' });
  const pastRejected = baseApp({ id: 'pr', decision: 'Reject', roundStatus: 'Past' });
  const withdrawnFuture = baseApp({ id: 'wf', decision: 'Withdrawn', roundStatus: 'Future' });

  const all = [accepted, pending, activeAccepted, pastAccepted, pastRejected, withdrawnFuture];

  test('active includes all in-flight non-withdrawn', () => {
    expect(filterByTab(all, 'active')
      .map((a) => a.id)
      .sort()).toEqual(['a', 'aa', 'p'].sort());
  });

  test('accepted includes only in-flight accepted', () => {
    expect(filterByTab(all, 'accepted')
      .map((a) => a.id)
      .sort()).toEqual(['a', 'aa'].sort());
  });

  test('pending includes only in-flight without decision', () => {
    expect(filterByTab(all, 'pending').map((a) => a.id)).toEqual(['p']);
  });

  test('past includes past rounds and withdrawn (any status)', () => {
    expect(filterByTab(all, 'past')
      .map((a) => a.id)
      .sort()).toEqual(['pa', 'pr', 'wf'].sort());
  });
});
