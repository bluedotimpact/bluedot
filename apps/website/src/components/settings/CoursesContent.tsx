import { ProgressDots, ErrorSection, CTALinkOrButton } from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { GetCourseRegistrationsResponse } from '../../pages/api/course-registrations';
import { GetCoursesResponse } from '../../pages/api/courses';
import { ROUTES } from '../../lib/routes';
import { P } from '../Text';
import CourseListRow from './CourseListRow';

type CoursesContentProps = {
  authToken: string;
};

const CoursesContent = ({ authToken }: CoursesContentProps) => {
  const [{ data: courseRegistrationsData, loading: courseRegistrationsLoading, error: courseRegistrationsError }] = useAxios<GetCourseRegistrationsResponse>({
    method: 'get',
    url: '/api/course-registrations',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const [{ data: coursesData, loading: coursesLoading, error: coursesError }] = useAxios<GetCoursesResponse>({
    method: 'get',
    url: '/api/courses',
  });

  // Combine courses and enrollments
  const enrolledCourses = (courseRegistrationsData?.courseRegistrations || [])
    .map((courseRegistration) => {
      const course = coursesData?.courses.find((c) => c.id === courseRegistration.courseId);
      return course ? [{ course, courseRegistration }] : [];
    })
    .flat();

  // Group courses by status
  const inProgressCourses = enrolledCourses.filter(({ courseRegistration }) => !courseRegistration.certificateCreatedAt);

  const completedCourses = enrolledCourses.filter(({ courseRegistration }) => !!courseRegistration.certificateCreatedAt).sort((a, b) => {
    // Sort completed courses by completion date (newest first)
    return (b.courseRegistration.certificateCreatedAt || 0) - (a.courseRegistration.certificateCreatedAt || 0);
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
                />
              ))}
            </div>
          </section>
        )}

        {/* TODO: Dropped out section - static text for now */}
        <div className="pt-4">
          <P className="font-semibold flex items-center gap-2">
            Dropped out
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 5L12.5 10L7.5 15"
                stroke="#00114D"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </P>
        </div>
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
