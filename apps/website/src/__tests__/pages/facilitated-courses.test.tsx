import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { pickVisibleNextDiscussions } from '../../pages/facilitated-courses';
import { bucketCoursesByTab } from '../../components/my-courses/useCourseListRow';
import type { CourseListRowProps } from '../../components/my-courses/CourseListRow';

// test-setup fixes TZ to UTC, so "local" day boundaries are UTC midnights.
const NOW = new Date('2026-04-28T15:00:00Z');

const item = (iso: string) => ({ id: iso, discussion: { startDateTime: Math.floor(Date.parse(iso) / 1000) } });
const ids = (items: { id: string }[]) => items.map((i) => i.id);

describe('pickVisibleNextDiscussions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns nothing when there are no discussions', () => {
    expect(pickVisibleNextDiscussions([])).toEqual([]);
  });

  test('with a single discussion today, shows just that one', () => {
    const a = item('2026-04-28T18:00:00Z');
    expect(ids(pickVisibleNextDiscussions([a]))).toEqual([a.id]);
  });

  test('with more than one discussion today, shows all of today\'s', () => {
    const morning = item('2026-04-28T09:00:00Z');
    const evening = item('2026-04-28T20:00:00Z');
    expect(ids(pickVisibleNextDiscussions([morning, evening]))).toEqual([morning.id, evening.id]);
  });

  test('with exactly one today plus a future day, shows only the next (today) one', () => {
    const today = item('2026-04-28T18:00:00Z');
    const tomorrow = item('2026-04-29T10:00:00Z');
    expect(ids(pickVisibleNextDiscussions([today, tomorrow]))).toEqual([today.id]);
  });

  test('with multiple today plus a future day, shows today\'s and drops the future one', () => {
    const morning = item('2026-04-28T09:00:00Z');
    const evening = item('2026-04-28T20:00:00Z');
    const tomorrow = item('2026-04-29T10:00:00Z');
    expect(ids(pickVisibleNextDiscussions([morning, evening, tomorrow]))).toEqual([morning.id, evening.id]);
  });

  test('with nothing today, falls back to the single soonest upcoming discussion', () => {
    const tomorrow = item('2026-04-29T10:00:00Z');
    const later = item('2026-05-02T10:00:00Z');
    expect(ids(pickVisibleNextDiscussions([tomorrow, later]))).toEqual([tomorrow.id]);
  });
});

describe('bucketCoursesByTab', () => {
  const facRow = (id: string, o: { roundStatus?: string; isDroppedOut?: boolean; isDeferred?: boolean } = {}): CourseListRowProps => ({
    courseRegistration: { id, roundStatus: o.roundStatus ?? 'Future', certificateCreatedAt: null },
    isDroppedOut: o.isDroppedOut ?? false,
    isDeferred: o.isDeferred ?? false,
  } as unknown as CourseListRowProps);

  const tabOf = (buckets: Record<string, CourseListRowProps[]>, id: string) =>
    Object.entries(buckets).find(([, rows]) => rows.some((r) => r.courseRegistration.id === id))?.[0] ?? null;

  test('buckets by round status by default', () => {
    const buckets = bucketCoursesByTab([
      facRow('active', { roundStatus: 'Active' }),
      facRow('future', { roundStatus: 'Future' }),
      facRow('past', { roundStatus: 'Past' }),
    ]);
    expect(tabOf(buckets, 'active')).toBe('inProgress');
    expect(tabOf(buckets, 'future')).toBe('upcoming');
    expect(tabOf(buckets, 'past')).toBe('pastCourses');
  });

  test('a dropped upcoming row moves to Past Courses (drop wins over Future)', () => {
    const buckets = bucketCoursesByTab([facRow('dropped', { roundStatus: 'Future', isDroppedOut: true })]);
    expect(tabOf(buckets, 'dropped')).toBe('pastCourses');
  });

  test('a deferred upcoming row stays in Upcoming (deferral keeps a live track)', () => {
    const buckets = bucketCoursesByTab([facRow('deferred', { roundStatus: 'Future', isDeferred: true })]);
    expect(tabOf(buckets, 'deferred')).toBe('upcoming');
  });
});
