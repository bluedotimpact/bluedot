import type { Meta, StoryObj } from '@storybook/react';
import CourseListRow from './CourseListRow';

const meta: Meta<typeof CourseListRow> = {
  title: 'Settings/CourseListRow',
  component: CourseListRow,
  parameters: {
    layout: 'padded',
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

// Mock course registration for in-progress course
const mockInProgressRegistration = {
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

// Mock course registration for completed course
const mockCompletedRegistration = {
  ...mockInProgressRegistration,
  id: 'reg-2',
  roundStatus: 'Completed',
  certificateId: 'cert-123',
  certificateCreatedAt: 1700000000, // Timestamp for completed date
};

// Mock course registration for facilitator
const mockFacilitatorRegistration = {
  ...mockInProgressRegistration,
  id: 'reg-3',
  role: 'Facilitator' as const,
};

export const InProgress: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockInProgressRegistration,
    authToken: 'test-token',
    isFirst: true,
    isLast: false,
  },
};

export const Completed: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockCompletedRegistration,
    authToken: 'test-token',
    isFirst: false,
    isLast: true,
  },
};

export const Facilitator: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockFacilitatorRegistration,
    authToken: 'test-token',
    isFirst: true,
    isLast: true,
  },
};

export const FirstInList: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockInProgressRegistration,
    authToken: 'test-token',
    isFirst: true,
    isLast: false,
  },
};

export const LastInList: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockInProgressRegistration,
    authToken: 'test-token',
    isFirst: false,
    isLast: true,
  },
};

export const OnlyItemInList: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockInProgressRegistration,
    authToken: 'test-token',
    isFirst: true,
    isLast: true,
  },
};

export const LongTitle: Story = {
  args: {
    course: {
      ...mockCourse,
      title: 'Advanced Machine Learning and Deep Neural Networks: A Comprehensive Introduction to Modern AI Techniques and Applications',
    },
    courseRegistration: mockInProgressRegistration,
    authToken: 'test-token',
    isFirst: true,
    isLast: true,
  },
};
