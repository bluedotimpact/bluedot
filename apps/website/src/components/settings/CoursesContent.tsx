import { useState } from 'react';
import { Course, CourseRegistration } from '@bluedot/db';
import {
  CTALinkOrButton, ErrorSection, P, ProgressDots,
} from '@bluedot/ui';
import { ROUTES } from '../../lib/routes';
import CourseListRow from './CourseListRow';
import { trpc } from '../../utils/trpc';

const CoursesContent = () => {
  const {
    data: courseRegistrations,
    isLoading: courseRegistrationsLoading,
    error: courseRegistrationsError,
  } = trpc.courseRegistrations.getAll.useQuery();

  const { data: courses, isLoading: coursesLoading, error: coursesError } = trpc.courses.getAll.useQuery();

  const isCompleted = (reg: CourseRegistration) => reg.roundStatus !== 'Active' && reg.roundStatus !== 'Future';

  // Combine courses and enrollments
  const enrolledCourses = (courseRegistrations || [])
    .filter((reg) => reg.roundStatus === 'Active' || reg.roundStatus === 'Past' || reg.roundStatus === 'Future' || reg.certificateCreatedAt)
    // Exclude dropped out courses (not deferrals)
    .filter((reg) => {
      // Dropped out means that we have a reference dropout record that is not a deferral
      const isDroppedOut = reg.dropoutId?.length && !reg.deferredId?.length;
      return !isDroppedOut;
    })
    .map((courseRegistration) => {
      const course = courses?.find((c) => c.id === courseRegistration.courseId);
      return course ? [{ course, courseRegistration }] : [];
    })
    .flat();

  // Group courses by status
  // Upcoming: Future courses (pending, accepted, or rejected applications)
  const upcomingCourses = enrolledCourses
    .filter(({ courseRegistration }) => courseRegistration.roundStatus === 'Future');

  // Fetch round start dates for upcoming courses
  const upcomingRoundIds = [...new Set(upcomingCourses.map(({ courseRegistration }) => courseRegistration.roundId).filter(Boolean))] as string[];
  const { data: roundStartDates } = trpc.courseRegistrations.getRoundStartDates.useQuery(
    { roundIds: upcomingRoundIds },
    { enabled: upcomingRoundIds.length > 0 },
  );

  // Completed: past courses for participants (non-facilitators), excluding deferred courses
  const completedCourses = enrolledCourses
    .filter(({ courseRegistration }) => isCompleted(courseRegistration) && courseRegistration.role !== 'Facilitator' && !courseRegistration.deferredId?.length)
    // No-cert courses first (to nudge user to complete), then by completion date descending
    .sort((a, b) => {
      const aTime = a.courseRegistration.certificateCreatedAt ?? Infinity;
      const bTime = b.courseRegistration.certificateCreatedAt ?? Infinity;
      if (aTime === bTime) return 0;
      return bTime - aTime;
    });

  // Facilitated: past courses for facilitators (facilitators cannot defer)
  const facilitatedCourses = enrolledCourses
    .filter(({ courseRegistration }) => isCompleted(courseRegistration) && courseRegistration.role === 'Facilitator');

  // In-progress: Active courses (both participants and facilitators)
  const inProgressCourses = enrolledCourses.filter(({ courseRegistration }) => courseRegistration.roundStatus === 'Active');

  const loading = courseRegistrationsLoading || coursesLoading;
  const error = courseRegistrationsError || coursesError;

  if (loading) return <ProgressDots />;
  if (error) return <ErrorSection error={error} />;

  const totalEnrolledCourses = upcomingCourses.length + inProgressCourses.length + completedCourses.length + facilitatedCourses.length;

  return (
    <div aria-label="Courses list">
      <div className="space-y-8">
        {upcomingCourses.length > 0 && (
          <section aria-label="Upcoming courses" className="lg:mt-2">
            <P className="font-semibold mb-4">Upcoming ({upcomingCourses.length})</P>
            <CourseList courses={upcomingCourses} roundStartDates={roundStartDates} />
          </section>
        )}
        {inProgressCourses.length > 0 && (
          <section aria-label="In Progress courses" className="lg:mt-2">
            <P className="font-semibold mb-4">In Progress ({inProgressCourses.length})</P>
            <CourseList courses={inProgressCourses} startExpanded />
          </section>
        )}
        {completedCourses.length > 0 && (
          <section aria-label="Completed courses">
            <P className="font-semibold mb-4">Completed ({completedCourses.length})</P>
            <CourseList courses={completedCourses} />
          </section>
        )}
        {facilitatedCourses.length > 0 && (
          <section aria-label="Facilitated courses">
            <P className="font-semibold mb-4">Facilitated ({facilitatedCourses.length})</P>
            <CourseList courses={facilitatedCourses} />
          </section>
        )}
      </div>

      {totalEnrolledCourses === 0 && (
        <div className="flex flex-col gap-4 mt-4">
          <P>You haven't started any courses yet</P>
          <CTALinkOrButton url={ROUTES.courses.url}>Join a course</CTALinkOrButton>
        </div>
      )}
    </div>
  );
};

const CourseList = ({ courses, startExpanded = false, roundStartDates }: {
  courses: { course: Course; courseRegistration: CourseRegistration }[];
  startExpanded?: boolean;
  roundStartDates?: Record<string, string | null>;
}) => {
  const SEE_ALL_THRESHOLD = 3;

  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? courses : courses.slice(0, SEE_ALL_THRESHOLD);

  return (
    <>
      <div className="border border-charcoal-light rounded-xl overflow-hidden">
        {displayed.map(({ course, courseRegistration }) => (
          <CourseListRow
            key={courseRegistration.id}
            course={course}
            courseRegistration={courseRegistration}
            startExpanded={startExpanded}
            roundStartDate={courseRegistration.roundId ? roundStartDates?.[courseRegistration.roundId] : undefined}
          />
        ))}
      </div>
      {courses.length > SEE_ALL_THRESHOLD && (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            aria-expanded={showAll}
            className="text-size-sm font-medium text-bluedot-normal hover:text-blue-700 transition-colors cursor-pointer"
          >
            {showAll ? 'Show less' : `See all (${courses.length}) courses`}
          </button>
        </div>
      )}
    </>
  );
};

export default CoursesContent;
