import type { Meta, StoryObj } from '@storybook/react';
import { loggedOutStory } from '@bluedot/ui';
import CourseDetails from './CourseDetails';
import { mockCourse as createMockCourse } from '../../__tests__/testUtils';

const meta: Meta<typeof CourseDetails> = {
  title: 'Settings/CourseDetails',
  component: CourseDetails,
  parameters: {
    layout: 'padded',
  },
  args: {
    ...loggedOutStory,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock course data
const mockCourse = createMockCourse();

// Mock course registration
const mockCourseRegistration = {
  id: 'reg-1',
  courseId: 'course-1',
  userId: 'user-1',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  role: 'Participant' as const,
  roundStatus: 'Active',
  certificateId: null,
  certificateCreatedAt: null,
  lastVisitedUnitNumber: null,
  lastVisitedChunkIndex: null,
  courseApplicationsBaseId: null,
  decision: null,
};

export const Default: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockCourseRegistration,
    authToken: 'test-token',
    isLast: false,
  },
              type: 'success',
};

export const LastItem: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockCourseRegistration,
    authToken: 'test-token',
    isLast: true,
  },
};

export const Facilitator: Story = {
  args: {
    course: mockCourse,
    courseRegistration: { ...mockCourseRegistration, role: 'Facilitator' },
    authToken: 'test-token',
    isLast: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Facilitators do not see the "Switch group" button for discussions.',
      },
    },
  },
};
