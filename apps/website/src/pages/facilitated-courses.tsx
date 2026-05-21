import type { CourseRegistration } from '@bluedot/db';
import { ErrorSection, ProgressDots } from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import MyBlueDotLayout from '../components/my-bluedot/MyBlueDotLayout';
import CourseList, { courseListRowKey } from '../components/my-courses/CourseList';
import { type CourseListRowProps } from '../components/my-courses/CourseListRow';
import { classifyCourseRegistration } from '../components/my-courses/useCourseListRow';
import NextDiscussionCard from '../components/my-courses/NextDiscussionCard';
import TabPills from '../components/my-courses/TabPills';
import { ROUTES } from '../lib/routes';
import { trpc } from '../utils/trpc';

const CURRENT_ROUTE = ROUTES.facilitatedCourses;

const TABS = [
  { id: 'inProgress', label: 'In Progress' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'pastCourses', label: 'Past Courses' },
] as const;

type CourseTab = typeof TABS[number]['id'];
const isCourseTab = (value: unknown): value is CourseTab => TABS.some((t) => t.id === value);

const EMPTY_MESSAGE: Record<CourseTab, string> = {
  inProgress: 'You are not facilitating any active courses.',
  upcoming: 'No upcoming facilitator assignments.',
  pastCourses: 'No past facilitator assignments.',
};

const sortByStartDateAsc = (courses: CourseListRowProps[]): CourseListRowProps[] => [...courses]
  .sort((a, b) => {
    const aStart = a.roundStartDate ? new Date(a.roundStartDate).getTime() : 0;
    const bStart = b.roundStartDate ? new Date(b.roundStartDate).getTime() : 0;
    return aStart - bStart;
  });

const sortByEndDateDesc = (courses: CourseListRowProps[]): CourseListRowProps[] => [...courses]
  .sort((a, b) => {
    const aEnd = a.roundEndDate ? new Date(a.roundEndDate).getTime() : 0;
    const bEnd = b.roundEndDate ? new Date(b.roundEndDate).getTime() : 0;
    return bEnd - aEnd;
  });

export const bucketCoursesByTab = (courses: CourseListRowProps[] | undefined): Record<CourseTab, CourseListRowProps[]> => {
  const assignTab = (cr: CourseRegistration): CourseTab | null => {
    if (cr.roundStatus === 'Active') return 'inProgress';
    if (cr.roundStatus === 'Future') return 'upcoming';
    if (cr.roundStatus === 'Past' || cr.certificateCreatedAt) return 'pastCourses';
    return null;
  };

  const buckets: Record<CourseTab, CourseListRowProps[]> = { inProgress: [], upcoming: [], pastCourses: [] };
  for (const row of courses ?? []) {
    const tab = assignTab(row.courseRegistration);
    if (tab) buckets[tab].push(row);
  }

  return {
    inProgress: sortByStartDateAsc(buckets.inProgress),
    upcoming: sortByStartDateAsc(buckets.upcoming),
    pastCourses: sortByEndDateDesc(buckets.pastCourses),
  };
};

const isAutoExpandCandidate = (row: CourseListRowProps): boolean => {
  const state = classifyCourseRegistration(row.courseRegistration);
  return state !== 'dropped' && row.discussions.length > 0;
};

type NextDiscussionItem = { discussion: { startDateTime: number } };

// Per designer: show all of today's discussions if there's more than one, otherwise just the next.
export const pickVisibleNextDiscussions = <T extends NextDiscussionItem>(items: T[]): T[] => {
  const startOfTodayLocal = new Date();
  startOfTodayLocal.setHours(0, 0, 0, 0);
  const startOfTomorrowLocal = startOfTodayLocal.getTime() + 24 * 60 * 60 * 1000;

  const today = items.filter((nd) => {
    const startMs = nd.discussion.startDateTime * 1000;
    return startMs >= startOfTodayLocal.getTime() && startMs < startOfTomorrowLocal;
  });

  if (today.length > 1) return today;
  return items.slice(0, 1);
};

const FacilitatedCoursesPage = () => {
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

  const { data, isLoading, error } = trpc.myBluedot.facilitatedCoursesPage.useQuery();

  const buckets = useMemo(() => bucketCoursesByTab(data?.courses), [data?.courses]);

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

  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});
  const expandedById = { ...expandedDefaults, ...expandedState };

  const handleToggleExpand = (id: string) => {
    const current = expandedById[id] ?? false;
    setExpandedState((m) => ({ ...m, [id]: !current }));
  };

  const visibleCourses = buckets[activeTab];
  // Per designer (mallorie): show either the single next discussion, or all of today's if >1.
  const visibleNextDiscussions = pickVisibleNextDiscussions(data?.nextDiscussions ?? []);

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      </Head>
      <MyBlueDotLayout route={CURRENT_ROUTE}>
        <div className="flex min-h-[60vh] flex-col gap-6">
          {isLoading && (
            <div className="flex flex-1 items-center justify-center">
              <ProgressDots />
            </div>
          )}
          {error && <ErrorSection error={error} />}
          {!isLoading && !error && data && (
            <>
              {visibleNextDiscussions.length > 0 && (
                <div>
                  <h2 className="mb-3 text-size-sm font-semibold text-bluedot-navy">
                    {visibleNextDiscussions.length === 1 ? 'Next discussion' : 'Next discussions'}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {visibleNextDiscussions.map((nd) => (
                      <NextDiscussionCard
                        key={`${nd.discussion.id}:${nd.group?.id ?? ''}`}
                        mode="facilitator"
                        courseSlug={nd.courseSlug}
                        courseTitle={nd.courseTitle}
                        discussion={nd.discussion}
                        unit={nd.unit}
                        group={nd.group}
                        facilitatorSubtitle={nd.facilitatorSubtitle}
                      />
                    ))}
                  </div>
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

export default FacilitatedCoursesPage;
