import type { Course, CourseRegistration } from '@bluedot/db';
import Head from 'next/head';
import { useRouter } from 'next/router';
import MyBlueDotLayout from '../components/MyBlueDotLayout';
import CourseList from '../components/my-courses/CourseList';
import NextDiscussionCard from '../components/my-courses/NextDiscussionCard';
import TabPills from '../components/my-courses/TabPills';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.myCourses;

const TABS = [
  { id: 'in-progress', label: 'In Progress' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past-courses', label: 'Past Courses' },
] as const;

type CourseTab = typeof TABS[number]['id'];

const isCourseTab = (value: unknown): value is CourseTab => TABS.some((t) => t.id === value);

type BucketedCourse = { course: Course; courseRegistration: CourseRegistration };

// Past Courses bundles completed + facilitated + dropped. Deferred registrations are excluded —
// they appear via their next-round registration in another bucket. Sort puts no-cert first
// (nudges users to complete) then certificate date desc.
export const bucketCourseRegistrations = (
  courseRegistrations: CourseRegistration[] | undefined,
  courses: Course[] | undefined,
): Record<CourseTab, BucketedCourse[]> => {
  const enrolled = (courseRegistrations ?? [])
    .filter((reg) => reg.roundStatus === 'Active' || reg.roundStatus === 'Past' || reg.roundStatus === 'Future' || reg.certificateCreatedAt)
    .filter((reg) => reg.decision !== 'Reject' || reg.roundStatus === 'Future')
    .flatMap((courseRegistration): BucketedCourse[] => {
      const course = courses?.find((c) => c.id === courseRegistration.courseId);
      return course ? [{ course, courseRegistration }] : [];
    });

  return {
    'in-progress': enrolled.filter(({ courseRegistration: r }) => r.roundStatus === 'Active'),
    upcoming: enrolled.filter(({ courseRegistration: r }) => r.roundStatus === 'Future'),
    'past-courses': enrolled
      .filter(({ courseRegistration: r }) => {
        if (r.deferredId?.length) return false;
        const isPast = r.roundStatus !== 'Active' && r.roundStatus !== 'Future';
        const isDroppedNotDeferred = Boolean(r.dropoutId?.length);
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

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      </Head>
      <MyBlueDotLayout route={CURRENT_ROUTE}>
        <div className="flex flex-col gap-6">
          <NextDiscussionCard />
          <TabPills
            ariaLabel="Course filter"
            tabs={TABS}
            value={activeTab}
            onChange={setActiveTab}
          />
          <CourseList />
        </div>
      </MyBlueDotLayout>
    </div>
  );
};

export default MyCoursesPage;
