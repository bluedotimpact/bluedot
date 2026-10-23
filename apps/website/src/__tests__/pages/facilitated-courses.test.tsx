import '@testing-library/jest-dom';
import {
  applicationsRoundTable, courseRegistrationTable, courseTable, groupDiscussionTable, groupTable, meetPersonTable, unitTable,
} from '@bluedot/db';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import FacilitatedCoursesPage, { pickVisibleNextDiscussions } from '../../pages/facilitated-courses';
import { bucketCoursesByTab } from '../../components/my-courses/useCourseListRow';
import type { CourseListRowProps } from '../../components/my-courses/CourseListRow';
import {
  createTrpcDbProvider, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../dbTestUtils';

const router = vi.hoisted(() => ({
  pathname: '/facilitated-courses',
  query: {} as Record<string, string>,
  replace: vi.fn(),
}));
vi.mock('next/router', () => ({ useRouter: () => router }));

vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

setupTestDb();

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
    isDeferredToAnotherRound: false,
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

describe('?changeFacilitator link', () => {
  const ROUND_ID = 'round-1';

  beforeEach(async () => {
    router.replace.mockClear();
    const inOneWeekSec = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    await seedLoggedInUser();
    await testDb.insert(courseTable, {
      id: 'course-1', slug: 'technical-ai-safety', title: 'Technical AI Safety', shortDescription: 'T', units: ['unit-1'], status: 'Active',
    });
    await testDb.insert(unitTable, {
      id: 'unit-1', courseId: 'course-1', courseSlug: 'technical-ai-safety', courseTitle: 'Technical AI Safety', title: 'Intro', unitNumber: '1', unitStatus: 'Active', chunks: [],
    });
    await testDb.insert(applicationsRoundTable, { id: ROUND_ID });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1', userId: 'test-user', courseId: 'course-1', role: 'Facilitator', decision: 'Accept', roundStatus: 'Active', roundId: ROUND_ID,
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp-fac', userId: 'test-user', applicationsBaseRecordId: 'reg-1', round: ROUND_ID, role: 'Facilitator', groupsAsFacilitator: ['group-7'], expectedDiscussionsFacilitator: ['disc-1'],
    });
    await testDb.insert(groupTable, {
      id: 'group-7', groupName: 'Group 7', round: ROUND_ID, facilitator: ['mp-fac'],
    });
    await testDb.insert(groupDiscussionTable, {
      id: 'disc-1', group: 'group-7', round: ROUND_ID, courseBuilderUnitRecordId: 'unit-1', startDateTime: inOneWeekSec, endDateTime: inOneWeekSec + 3600, facilitators: ['mp-fac'],
    });
  });

  const renderPage = (query: Record<string, string>) => {
    router.query = query;
    return render(<FacilitatedCoursesPage />, { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) });
  };

  test('opens "Change facilitator" for that discussion, and closing removes only that param', async () => {
    renderPage({ tab: 'upcoming', changeFacilitator: 'disc-1' });

    expect(await screen.findByRole('button', { name: /Select action type/i })).toHaveTextContent('Change facilitator');
    expect(await screen.findByRole('button', { name: /For which discussion/ })).toHaveTextContent('Unit 1: Intro');
    expect(screen.getByRole('button', { name: /For which group/ })).toHaveTextContent('Group 7');
    expect(screen.getByRole('button', { name: /Have you found someone to cover/ })).toHaveTextContent('Yes, I\'ve agreed with someone');
    expect(screen.getByRole('button', { name: /Select new facilitator/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(router.replace).toHaveBeenCalledWith(
      { pathname: '/facilitated-courses', query: { tab: 'upcoming' } },
      undefined,
      { shallow: true },
    );
  });

  test('does not open for a discussion the user does not facilitate', async () => {
    renderPage({ changeFacilitator: 'disc-someone-else' });

    expect(await screen.findByText('Technical AI Safety')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Select action type/i })).not.toBeInTheDocument();
  });
});
