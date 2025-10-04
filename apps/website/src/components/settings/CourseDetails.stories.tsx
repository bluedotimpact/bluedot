import type { Meta, StoryObj } from '@storybook/react';
import { loggedOutStory } from '@bluedot/ui';
import CourseDetails from './CourseDetails';

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
const mockCourse = {
  id: 'course-1',
  title: 'Introduction to AI Safety',
  slug: 'intro-ai-safety',
  path: '/courses/intro-ai-safety',
  description: 'Learn the fundamentals of AI safety and alignment',
  shortDescription: 'AI safety basics',
  detailsUrl: '/courses/intro-ai-safety',
  displayOnCourseHubIndex: true,
  durationDescription: '8 weeks',
  durationHours: 40,
  units: ['unit-1', 'unit-2', 'unit-3'],
  cadence: 'Weekly',
  level: 'Beginner',
  status: 'Active',
  isNew: false,
  isFeatured: true,
  image: null,
  certificationBadgeImage: null,
  certificationDescription: null,
  averageRating: null,
  publicLastUpdated: null,
};

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
