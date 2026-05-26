import { ErrorSection, ProgressDots } from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import MyBlueDotLayout from '../components/my-bluedot/MyBlueDotLayout';
import InactiveCourseBanners from '../components/courses/InactiveCourseBanners';
import CourseList, { courseListRowKey } from '../components/my-courses/CourseList';
import EmptyCourseList, { type EmptyCourseListProps } from '../components/my-courses/EmptyCourseList';
import { type CourseListRowProps } from '../components/my-courses/CourseListRow';
import {
  TABS, type CourseTab, isCourseTab, isAutoExpandCandidate, bucketCoursesByTab as bucketRowsByTab,
} from '../components/my-courses/useCourseListRow';
import NextDiscussionCard from '../components/my-courses/NextDiscussionCard';
import TabPills from '../components/my-courses/TabPills';
import { ROUTES } from '../lib/routes';
import { trpc } from '../utils/trpc';

const CURRENT_ROUTE = ROUTES.myCourses;

const BROWSE_COURSES = { label: 'Browse courses', href: ROUTES.courses.url };

const EMPTY_STATE: Record<CourseTab, EmptyCourseListProps> = {
  inProgress: {
    title: 'No active courses',
    description: 'You\'re not currently enrolled in any active courses.',
    cta: BROWSE_COURSES,
  },
  upcoming: {
    title: 'No upcoming courses',
    description: 'You have no upcoming courses.',
    cta: BROWSE_COURSES,
  },
  pastCourses: {
    title: 'No past courses',
    description: 'Courses you\'ve completed will appear here.',
    cta: BROWSE_COURSES,
  },
};

// Participants see rejected applications only while the round is still Future, and rows must have a
// bucketable round status (or a certificate). Facilitators don't filter this way (their data is
// pre-filtered server-side), so this stays on the participant page rather than in the shared bucketer.
const isParticipantEligible = (row: CourseListRowProps): boolean => {
  const { courseRegistration: cr } = row;
  const hasBucketableStatus = cr.roundStatus === 'Active' || cr.roundStatus === 'Past' || cr.roundStatus === 'Future' || !!cr.certificateCreatedAt;
  const visibleIfRejected = cr.decision !== 'Reject' || cr.roundStatus === 'Future';
  return hasBucketableStatus && visibleIfRejected;
};

export const bucketCoursesByTab = (courses: CourseListRowProps[] | undefined): Record<CourseTab, CourseListRowProps[]> =>
  bucketRowsByTab(courses, isParticipantEligible);

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

  // Auto-expand the top row of In Progress and Upcoming only
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

export default MyCoursesPage;
