import { ErrorSection, ProgressDots } from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import MyBlueDotLayout from '../components/my-bluedot/MyBlueDotLayout';
import InactiveCourseBanners from '../components/courses/InactiveCourseBanners';
import CourseList, { courseListRowKey } from '../components/my-courses/CourseList';
import { type CourseListRowProps } from '../components/my-courses/CourseListRow';
import { classifyCourseRegistration } from '../components/my-courses/useCourseActions';
import NextDiscussionCard from '../components/my-courses/NextDiscussionCard';
import TabPills from '../components/my-courses/TabPills';
import { ROUTES } from '../lib/routes';
import { trpc } from '../utils/trpc';

const CURRENT_ROUTE = ROUTES.myCourses;

const TABS = [
  { id: 'inProgress', label: 'In Progress' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'pastCourses', label: 'Past Courses' },
] as const;

type CourseTab = typeof TABS[number]['id'];
const isCourseTab = (value: unknown): value is CourseTab => TABS.some((t) => t.id === value);

const EMPTY_MESSAGE: Record<CourseTab, string> = {
  inProgress: 'You are not enrolled in any active courses.',
  upcoming: 'No upcoming courses to show.',
  pastCourses: 'No past courses to show.',
};

/**
 * Sort by latest "open" (not-attended, not-past) discussion descending. This forces
 * courses with any remaining discussions to bubble above fully-completed ones that
 * are just waiting for a certificate.
*/
const sortByFinalDiscussionDesc = (courses: CourseListRowProps[]): CourseListRowProps[] => {
  const nowSec = Math.floor(Date.now() / 1000);
  const sortKey = (c: CourseListRowProps): number => {
    const attendedSet = new Set(c.attendedDiscussionIds);

    const openTimes = c.discussions
      .filter((d) => !attendedSet.has(d.id) && d.endDateTime >= nowSec)
      .map((d) => d.startDateTime);

    if (openTimes.length > 0) {
      return Math.max(...openTimes);
    }

    if (c.roundStartDate) {
      return new Date(c.roundStartDate).getTime() / 1000;
    }

    return 0;
  };

  return [...courses].sort((a, b) => sortKey(b) - sortKey(a));
};

export const bucketCoursesByTab = (courses: CourseListRowProps[] | undefined): Record<CourseTab, CourseListRowProps[]> => {
  const assignTab = (row: CourseListRowProps): CourseTab | null => {
    const { courseRegistration: cr, isDroppedOut, isDeferred } = row;
    if (isDeferred) {
      if (cr.roundStatus === 'Active') return 'inProgress';
      if (cr.roundStatus === 'Future') return 'upcoming';
      return null;
    }

    if (isDroppedOut) return 'pastCourses';
    if (cr.roundStatus === 'Active') return 'inProgress';
    if (cr.roundStatus === 'Future') return 'upcoming';
    return 'pastCourses';
  };

  const eligible = (courses ?? [])
    .filter(({ courseRegistration: cr }) => cr.roundStatus === 'Active' || cr.roundStatus === 'Past' || cr.roundStatus === 'Future' || cr.certificateCreatedAt)
    .filter(({ courseRegistration: cr }) => cr.decision !== 'Reject' || cr.roundStatus === 'Future');

  const buckets: Record<CourseTab, CourseListRowProps[]> = { inProgress: [], upcoming: [], pastCourses: [] };
  for (const row of eligible) {
    const tab = assignTab(row);
    if (tab) buckets[tab].push(row);
  }

  return {
    inProgress: sortByFinalDiscussionDesc(buckets.inProgress),
    upcoming: sortByFinalDiscussionDesc(buckets.upcoming),
    pastCourses: buckets.pastCourses
      .sort((a, b) => (b.courseRegistration.certificateCreatedAt ?? Infinity) - (a.courseRegistration.certificateCreatedAt ?? Infinity)),
  };
};

const isAutoExpandCandidate = (course: CourseListRowProps): boolean => {
  const state = classifyCourseRegistration(course.courseRegistration, { isDroppedOut: course.isDroppedOut, isDeferred: course.isDeferred });
  const canExpand = state !== 'dropped' || course.attendedDiscussionIds.length > 0;
  return canExpand && course.discussions.length > 0;
};

const MyCoursesPage = () => {
  const router = useRouter();
  const queryTab = router.query.tab;
  const activeTab: CourseTab = isCourseTab(queryTab) ? queryTab : 'inProgress';

  const setActiveTab = (id: CourseTab) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab: id } },
      undefined,
      { shallow: true },
    );
  };

  const { data, isLoading, error } = trpc.myBluedot.myCoursesPage.useQuery();

  const buckets = useMemo(() => bucketCoursesByTab(data?.courses), [data?.courses]);

  // Auto-expand the top row of In Progress and Upcoming only. Past Courses can run long
  // (some users have 18+ past rows), so we keep them collapsed and rely on the per-row chevron.
  const expandedDefaults = useMemo<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const tab of ['inProgress', 'upcoming'] as const) {
      const top = buckets[tab][0];
      if (top && isAutoExpandCandidate(top)) {
        m[courseListRowKey(top)] = true;
      }
    }

    return m;
  }, [buckets]);

  // expandedState is defined at the page level, so rows don't collapse when you switch tabs
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});
  const expandedById = { ...expandedDefaults, ...expandedState };

  const handleToggleExpand = (id: string) => {
    const current = expandedById[id] ?? false;
    setExpandedState((m) => ({ ...m, [id]: !current }));
  };

  const visibleCourses = buckets[activeTab];
  const nextDiscussion = data?.nextDiscussion ?? null;

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      </Head>
      <MyBlueDotLayout route={CURRENT_ROUTE} afterBreadcrumbs={<InactiveCourseBanners />}>
        <div className="flex min-h-[60vh] flex-col gap-6">
          {isLoading && (
            <div className="flex flex-1 items-center justify-center">
              <ProgressDots />
            </div>
          )}
          {error && <ErrorSection error={error} />}
          {!isLoading && !error && data && (
            <>
              {nextDiscussion && (
                <div>
                  <h2 className="mb-3 text-size-sm font-semibold text-bluedot-navy">Next discussion</h2>
                  <NextDiscussionCard
                    courseSlug={nextDiscussion.courseSlug}
                    courseTitle={nextDiscussion.courseTitle}
                    discussion={nextDiscussion.discussion}
                    unit={nextDiscussion.unit}
                  />
                </div>
              )}
              <TabPills
                ariaLabel="Course filter"
                tabs={TABS}
                value={activeTab}
                onChange={setActiveTab}
              />
              <CourseList
                key={activeTab}
                courses={visibleCourses}
                emptyMessage={EMPTY_MESSAGE[activeTab]}
                expandedById={expandedById}
                onToggleExpand={handleToggleExpand}
              />
            </>
          )}
        </div>
      </MyBlueDotLayout>
    </div>
  );
};

export default MyCoursesPage;
