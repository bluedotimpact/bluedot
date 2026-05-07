import { ErrorSection, ProgressDots } from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import MyBlueDotLayout from '../components/MyBlueDotLayout';
import CourseList, { type EnrichedCourse } from '../components/my-courses/CourseList';
import NextDiscussionSection from '../components/my-courses/NextDiscussionSection';
import TabPills from '../components/my-courses/TabPills';
import { ROUTES } from '../lib/routes';
import { trpc } from '../utils/trpc';

const CURRENT_ROUTE = ROUTES.myCourses;

const TABS = [
  { id: 'in-progress', label: 'In Progress' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past-courses', label: 'Past Courses' },
] as const;

type CourseTab = typeof TABS[number]['id'];

const isCourseTab = (value: unknown): value is CourseTab => TABS.some((t) => t.id === value);

const EMPTY_MESSAGE: Record<CourseTab, string> = {
  'in-progress': 'You are not enrolled in any active courses.',
  upcoming: 'No upcoming courses.',
  'past-courses': 'No past courses to show.',
};

// Past Courses bundles completed + facilitated + dropped. Deferred registrations are excluded —
// they appear via their next-round registration in another bucket. Sort puts no-cert first
// (nudges users to complete) then certificate date desc.
export const bucketCourses = (courses: EnrichedCourse[] | undefined): Record<CourseTab, EnrichedCourse[]> => {
  const eligible = (courses ?? [])
    .filter(({ courseRegistration: cr }) => cr.roundStatus === 'Active' || cr.roundStatus === 'Past' || cr.roundStatus === 'Future' || cr.certificateCreatedAt)
    .filter(({ courseRegistration: cr }) => cr.decision !== 'Reject' || cr.roundStatus === 'Future');

  return {
    'in-progress': eligible.filter(({ courseRegistration: cr }) => cr.roundStatus === 'Active'),
    upcoming: eligible.filter(({ courseRegistration: cr }) => cr.roundStatus === 'Future'),
    'past-courses': eligible
      .filter(({ courseRegistration: cr }) => {
        if (cr.deferredId?.length) return false;
        const isPast = cr.roundStatus !== 'Active' && cr.roundStatus !== 'Future';
        const isDroppedNotDeferred = Boolean(cr.dropoutId?.length);
        return isPast || isDroppedNotDeferred;
      })
      .sort((a, b) => (b.courseRegistration.certificateCreatedAt ?? Infinity) - (a.courseRegistration.certificateCreatedAt ?? Infinity)),
  };
};

const MyCoursesPage = () => {
  const router = useRouter();
  const queryTab = router.query.tab;
  const activeTab: CourseTab = isCourseTab(queryTab) ? queryTab : 'in-progress';

  const setActiveTab = (id: CourseTab) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab: id } },
      undefined,
      { shallow: true },
    );
  };

  const { data, isLoading, error } = trpc.myCoursesPage.getOverview.useQuery();

  const buckets = bucketCourses(data?.courses);
  const visibleCourses = buckets[activeTab];
  const nextDiscussion = data?.nextDiscussion ?? null;

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
              {nextDiscussion && (
                <NextDiscussionSection
                  courseSlug={nextDiscussion.courseSlug}
                  discussion={nextDiscussion.discussion}
                  unit={nextDiscussion.unit}
                />
              )}
              <TabPills
                ariaLabel="Course filter"
                tabs={TABS}
                value={activeTab}
                onChange={setActiveTab}
              />
              <CourseList courses={visibleCourses} emptyMessage={EMPTY_MESSAGE[activeTab]} />
            </>
          )}
        </div>
      </MyBlueDotLayout>
    </div>
  );
};

export default MyCoursesPage;
