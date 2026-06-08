import { ErrorSection, ProgressDots } from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import MyBlueDotLayout from '../components/my-bluedot/MyBlueDotLayout';
import CourseList, { courseListRowKey } from '../components/my-courses/CourseList';
import EmptyCourseList, { type EmptyCourseListProps } from '../components/my-courses/EmptyCourseList';
import {
  TABS, type CourseTab, isCourseTab, isAutoExpandCandidate, bucketCoursesByTab,
} from '../components/my-courses/useCourseListRow';
import NextDiscussionCard from '../components/my-courses/NextDiscussionCard';
import { QuickApplyBanner } from '../components/my-courses/QuickApplyBanner';
import TabPills from '../components/my-courses/TabPills';
import { ROUTES } from '../lib/routes';
import { trpc } from '../utils/trpc';

const CURRENT_ROUTE = ROUTES.facilitatedCourses;

const APPLY_TO_FACILITATE = { label: 'Apply now to facilitate', href: '/join-us/facilitate' };

const EMPTY_STATE: Record<CourseTab, EmptyCourseListProps> = {
  inProgress: {
    title: 'No active courses',
    description: 'You\'re not facilitating any active courses right now.',
    cta: APPLY_TO_FACILITATE,
  },
  upcoming: {
    title: 'No upcoming courses',
    description: 'You have no upcoming facilitation assignments.',
    cta: APPLY_TO_FACILITATE,
  },
  pastCourses: {
    title: 'No past courses',
    description: 'Courses you\'ve facilitated will appear here.',
    cta: APPLY_TO_FACILITATE,
  },
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
              <QuickApplyBanner />
              <TabPills
                ariaLabel="Course filter"
                tabs={TABS}
                value={activeTab}
                onChange={setActiveTab}
              />
              {visibleCourses.length === 0 ? (
                <EmptyCourseList {...EMPTY_STATE[activeTab]} />
              ) : (
                <CourseList
                  key={activeTab}
                  courses={visibleCourses}
                  expandedById={expandedById}
                  onToggleExpand={handleToggleExpand}
                />
              )}
            </>
          )}
        </div>
      </MyBlueDotLayout>
    </div>
  );
};

export default FacilitatedCoursesPage;
