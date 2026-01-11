import { useState } from 'react';
import { CourseRegistration } from '@bluedot/db';
import {
  CTALinkOrButton, ErrorSection, P, ProgressDots,
} from '@bluedot/ui';
import { ROUTES } from '../../lib/routes';
import CourseListRow from './CourseListRow';
import { trpc } from '../../utils/trpc';

const SEE_ALL_THRESHOLD = 5;

const CoursesContent = () => {
  const [showAllInProgress, setShowAllInProgress] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [showAllFacilitated, setShowAllFacilitated] = useState(false);

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

  // Calculate which courses to display based on "See all" state
  const displayedInProgressCourses = showAllInProgress ? inProgressCourses : inProgressCourses.slice(0, SEE_ALL_THRESHOLD);
  const displayedCompletedCourses = showAllCompleted ? completedCourses : completedCourses.slice(0, SEE_ALL_THRESHOLD);
  const displayedFacilitatedCourses = showAllFacilitated ? facilitatedCourses : facilitatedCourses.slice(0, SEE_ALL_THRESHOLD);

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
            <div className="flex items-center justify-between mb-4">
              <P className="font-semibold">
                In Progress ({inProgressCourses.length})
              </P>
            </div>
            <div>
              {displayedInProgressCourses.map(({ course, courseRegistration }, index) => (
                <CourseListRow
                  key={courseRegistration.id}
                  course={course}
                  courseRegistration={courseRegistration}
                  isFirst={index === 0}
                  isLast={index === displayedInProgressCourses.length - 1}
                  startExpanded
                />
              ))}
            </div>
            {inProgressCourses.length > SEE_ALL_THRESHOLD && (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllInProgress(!showAllInProgress)}
                  className="text-size-sm font-medium text-bluedot-normal hover:text-blue-700 transition-colors cursor-pointer"
                >
                  {showAllInProgress ? 'Show less' : `See all (${inProgressCourses.length}) courses`}
                </button>
              </div>
            )}
          </section>
        )}
        {completedCourses.length > 0 && (
          <section aria-label="Completed courses">
            <div className="flex items-center justify-between mb-4">
              <P className="font-semibold">
                Completed ({completedCourses.length})
              </P>
            </div>
            <div>
              {displayedCompletedCourses.map(({ course, courseRegistration }, index) => (
                <CourseListRow
                  key={courseRegistration.id}
                  course={course}
                  courseRegistration={courseRegistration}
                  isFirst={index === 0}
                  isLast={index === displayedCompletedCourses.length - 1}
                />
              ))}
            </div>
            {completedCourses.length > SEE_ALL_THRESHOLD && (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllCompleted(!showAllCompleted)}
                  className="text-size-sm font-medium text-bluedot-normal hover:text-blue-700 transition-colors cursor-pointer"
                >
                  {showAllCompleted ? 'Show less' : `See all (${completedCourses.length}) courses`}
                </button>
              </div>
            )}
          </section>
        )}
        {facilitatedCourses.length > 0 && (
          <section aria-label="Facilitated courses">
            <div className="flex items-center justify-between mb-4">
              <P className="font-semibold">
                Facilitated ({facilitatedCourses.length})
              </P>
            </div>
            <div>
              {displayedFacilitatedCourses.map(({ course, courseRegistration }, index) => (
                <CourseListRow
                  key={courseRegistration.id}
                  course={course}
                  courseRegistration={courseRegistration}
                  isFirst={index === 0}
                  isLast={index === displayedFacilitatedCourses.length - 1}
                  isFacilitated
                />
              ))}
            </div>
            {facilitatedCourses.length > SEE_ALL_THRESHOLD && (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllFacilitated(!showAllFacilitated)}
                  className="text-size-sm font-medium text-bluedot-normal hover:text-blue-700 transition-colors cursor-pointer"
                >
                  {showAllFacilitated ? 'Show less' : `See all (${facilitatedCourses.length}) courses`}
                </button>
              </div>
            )}
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

export default CoursesContent;
