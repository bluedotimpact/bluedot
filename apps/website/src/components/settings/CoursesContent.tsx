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

  const isCompleted = (reg: CourseRegistration) => reg.roundStatus !== 'Active';

  // Combine courses and enrollments
  const enrolledCourses = (courseRegistrations || [])
    .filter((reg) => reg.roundStatus === 'Active' || reg.roundStatus === 'Past' || reg.certificateCreatedAt)
    .map((courseRegistration) => {
      const course = courses?.find((c) => c.id === courseRegistration.courseId);
      return course ? [{ course, courseRegistration }] : [];
    })
    .flat();

  // Group courses by status
  // Completed: past courses for participants (non-facilitators)
  const completedCourses = enrolledCourses
    .filter(({ courseRegistration }) => isCompleted(courseRegistration) && courseRegistration.role !== 'Facilitator')
    // No-cert courses first (to nudge user to complete), then by completion date descending
    .sort((a, b) => (b.courseRegistration.certificateCreatedAt ?? Infinity) - (a.courseRegistration.certificateCreatedAt ?? Infinity));

  // Facilitated: past courses for facilitators
  const facilitatedCourses = enrolledCourses
    .filter(({ courseRegistration }) => isCompleted(courseRegistration) && courseRegistration.role === 'Facilitator')
    // Sort by most recent first (using certificateCreatedAt as proxy, though facilitators don't get certs)
    .sort((a, b) => (b.courseRegistration.certificateCreatedAt ?? Infinity) - (a.courseRegistration.certificateCreatedAt ?? Infinity));

  // In-progress: Active courses (both participants and facilitators)
  const inProgressCourses = enrolledCourses.filter(({ courseRegistration }) => !isCompleted(courseRegistration));

  const loading = courseRegistrationsLoading || coursesLoading;
  const error = courseRegistrationsError || coursesError;

  if (loading) return <ProgressDots />;
  if (error) return <ErrorSection error={error} />;

  const totalEnrolledCourses = inProgressCourses.length + completedCourses.length + facilitatedCourses.length;

  return (
    <div aria-label="Courses list">
      <div className="space-y-8">
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

const CourseList = ({ courses, startExpanded = false }: {
  courses: { course: Course; courseRegistration: CourseRegistration }[];
  startExpanded?: boolean;
}) => {
  const SEE_ALL_THRESHOLD = 3;

  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? courses : courses.slice(0, SEE_ALL_THRESHOLD);

  return (
    <>
      <div>
        {displayed.map(({ course, courseRegistration }, index) => (
          <CourseListRow
            key={courseRegistration.id}
            course={course}
            courseRegistration={courseRegistration}
            isFirst={index === 0}
            isLast={index === displayed.length - 1}
            startExpanded={startExpanded}
          />
        ))}
      </div>
      {courses.length > SEE_ALL_THRESHOLD && (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
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
