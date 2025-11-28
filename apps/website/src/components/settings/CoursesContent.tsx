import { ProgressDots, ErrorSection, CTALinkOrButton } from '@bluedot/ui';
import { ROUTES } from '../../lib/routes';
import { P } from '../Text';
import CourseListRow from './CourseListRow';
import { trpc } from '../../utils/trpc';

const CoursesContent = () => {
  const {
    data: courseRegistrations,
    isLoading: courseRegistrationsLoading,
    error: courseRegistrationsError,
  } = trpc.courseRegistrations.getAll.useQuery();

  const { data: courses, isLoading: coursesLoading, error: coursesError } = trpc.courses.getAll.useQuery();

  // Combine courses and enrollments
  const enrolledCourses = (courseRegistrations || [])
    .map((courseRegistration) => {
      const course = courses?.find((c) => c.id === courseRegistration.courseId);
      return course ? [{ course, courseRegistration }] : [];
    })
    .flat();

  // Group courses by status
  const inProgressCourses = enrolledCourses.filter(({ courseRegistration }) => courseRegistration.roundStatus === 'Active');

  const completedCourses = enrolledCourses.filter(({ courseRegistration }) => !!courseRegistration.certificateCreatedAt).sort((a, b) => {
    // Sort completed courses by completion date (newest first)
    return (b.courseRegistration.certificateCreatedAt ?? 0) - (a.courseRegistration.certificateCreatedAt ?? 0);
  });

  const loading = courseRegistrationsLoading || coursesLoading;
  const error = courseRegistrationsError || coursesError;

  if (loading) return <ProgressDots />;
  if (error) return <ErrorSection error={error} />;

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
              {inProgressCourses.map(({ course, courseRegistration }, index) => (
                <CourseListRow
                  key={courseRegistration.id}
                  course={course}
                  courseRegistration={courseRegistration}
                  isFirst={index === 0}
                  isLast={index === inProgressCourses.length - 1}
                  isCompleted={false}
                />
              ))}
            </div>
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
              {completedCourses.map(({ course, courseRegistration }, index) => (
                <CourseListRow
                  key={courseRegistration.id}
                  course={course}
                  courseRegistration={courseRegistration}
                  isFirst={index === 0}
                  isLast={index === completedCourses.length - 1}
                  isCompleted
                />
              ))}
            </div>
          </section>
        )}

      </div>

      {enrolledCourses.length === 0 && (
        <div className="flex flex-col gap-4 mt-4">
          <P>You haven't started any courses yet</P>
          <CTALinkOrButton url={ROUTES.courses.url}>Join a course</CTALinkOrButton>
        </div>
      )}
    </div>
  );
};

export default CoursesContent;
