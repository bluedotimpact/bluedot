import { CourseRegistration } from '@bluedot/db';
import {
  CTALinkOrButton, ErrorSection, P, ProgressDots,
} from '@bluedot/ui';
import { ROUTES } from '../../lib/routes';
import CourseListRow from './CourseListRow';
import { trpc } from '../../utils/trpc';
import { createMockCourse, createMockCourseRegistration, createMockMeetPerson } from '../../__tests__/testUtils';

// GH-1876: Mock data for button state testing (set to false to hide)
const SHOW_MOCK_BUTTON_STATES = true;

const mockAgiStrategyCourse = createMockCourse({
  id: 'mock-course-agi',
  title: 'AGI Strategy',
  slug: 'agi-strategy',
  path: '/courses/agi-strategy',
});

const mockMeetPersonBase = createMockMeetPerson({
  uniqueDiscussionAttendance: 2,
  numUnits: 5,
  groupsAsParticipant: ['group-1'],
  courseFeedbackForm: 'https://airtable.com/example-feedback-form',
  courseFeedback: [],
});

const mockCases = [
  // Case 1: No cert, action plan NOT submitted (requires action plan)
  {
    label: 'No cert, action plan not submitted',
    course: mockAgiStrategyCourse,
    courseRegistration: createMockCourseRegistration({
      id: 'mock-reg-1',
      courseId: 'mock-course-agi',
      roundStatus: 'Past',
      certificateId: null,
      certificateCreatedAt: null,
    }),
    meetPerson: createMockMeetPerson({
      ...mockMeetPersonBase,
      id: 'mock-meet-person-1',
      projectSubmission: [],
      courseFeedback: [],
    }),
  },
  // Case 2: No cert, action plan SUBMITTED (requires action plan)
  {
    label: 'No cert, action plan submitted',
    course: mockAgiStrategyCourse,
    courseRegistration: createMockCourseRegistration({
      id: 'mock-reg-2',
      courseId: 'mock-course-agi',
      roundStatus: 'Past',
      certificateId: null,
      certificateCreatedAt: null,
    }),
    meetPerson: createMockMeetPerson({
      ...mockMeetPersonBase,
      id: 'mock-meet-person-2',
      projectSubmission: ['action-plan-record-1'],
      courseFeedback: [],
    }),
  },
  // Case 3: Certificate exists, feedback NOT submitted (locked)
  {
    label: 'Certificate, feedback not submitted (locked)',
    course: mockAgiStrategyCourse,
    courseRegistration: createMockCourseRegistration({
      id: 'mock-reg-3',
      courseId: 'mock-course-agi',
      roundStatus: 'Past',
      certificateId: 'cert-123',
      certificateCreatedAt: 1710288000, // Mar 12, 2025
    }),
    meetPerson: createMockMeetPerson({
      ...mockMeetPersonBase,
      id: 'mock-meet-person-3',
      uniqueDiscussionAttendance: 5,
      numUnits: 5,
      projectSubmission: ['action-plan-record-1'],
      courseFeedback: [], // No feedback
    }),
  },
  // Case 4: Certificate exists, feedback SUBMITTED
  {
    label: 'Certificate, feedback submitted',
    course: mockAgiStrategyCourse,
    courseRegistration: createMockCourseRegistration({
      id: 'mock-reg-4',
      courseId: 'mock-course-agi',
      roundStatus: 'Past',
      certificateId: 'cert-456',
      certificateCreatedAt: 1710288000, // Mar 12, 2025
    }),
    meetPerson: createMockMeetPerson({
      ...mockMeetPersonBase,
      id: 'mock-meet-person-4',
      uniqueDiscussionAttendance: 5,
      numUnits: 5,
      projectSubmission: ['action-plan-record-1'],
      courseFeedback: ['feedback-record-1'], // Feedback submitted
    }),
  },
];

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
  const enrolledCoursesToDisplay = enrolledCourses
    // Don't show completed courses for facilitators, they don't get certificates
    .filter(({ courseRegistration }) => !(isCompleted(courseRegistration) && courseRegistration.role === 'Facilitator'));

  // Group courses by status
  const completedCoursesReal = enrolledCoursesToDisplay
    .filter(({ courseRegistration }) => isCompleted(courseRegistration))
    // No-cert courses first (to nudge user to complete), then by completion date descending
    .sort((a, b) => (b.courseRegistration.certificateCreatedAt ?? Infinity) - (a.courseRegistration.certificateCreatedAt ?? Infinity));

  // Add mock cases after real data for testing
  const completedCourses = SHOW_MOCK_BUTTON_STATES
    ? [...completedCoursesReal.map((c) => ({ ...c, mockMeetPerson: undefined as typeof mockCases[0]['meetPerson'] | undefined })), ...mockCases.map((m) => ({ course: m.course, courseRegistration: m.courseRegistration, mockMeetPerson: m.meetPerson }))]
    : completedCoursesReal.map((c) => ({ ...c, mockMeetPerson: undefined as typeof mockCases[0]['meetPerson'] | undefined }));

  // In-progress: everything else (Active + no certificate)
  const inProgressCourses = enrolledCoursesToDisplay.filter(({ courseRegistration }) => !isCompleted(courseRegistration));

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
                  startExpanded
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
              {completedCourses.map(({ course, courseRegistration, mockMeetPerson }, index) => (
                <CourseListRow
                  key={courseRegistration.id}
                  course={course}
                  courseRegistration={courseRegistration}
                  isFirst={index === 0}
                  isLast={index === completedCourses.length - 1}
                  mockMeetPerson={mockMeetPerson}
                />
              ))}
            </div>
          </section>
        )}

      </div>

      {enrolledCoursesToDisplay.length === 0 && (
        <div className="flex flex-col gap-4 mt-4">
          <P>You haven't started any courses yet</P>
          <CTALinkOrButton url={ROUTES.courses.url}>Join a course</CTALinkOrButton>
        </div>
      )}
    </div>
  );
};

export default CoursesContent;
