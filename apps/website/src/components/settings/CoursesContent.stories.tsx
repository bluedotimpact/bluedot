import type { Meta, StoryObj } from '@storybook/react';
import CoursesContent from './CoursesContent';

// Note: This component uses axios-hooks which requires API mocking
// For full interactive stories, consider setting up MSW (Mock Service Worker)
// or using a mock server in your Storybook configuration

const meta: Meta<typeof CoursesContent> = {
  title: 'Settings/CoursesContent',
  component: CoursesContent,
  parameters: {
    layout: 'padded',
  },
  args: {
    authToken: 'mock-auth-token',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic story showing the component structure
// In a real environment, this would fetch data from the API endpoints
export const Default: Story = {
  args: {
    authToken: 'test-auth-token',
  },
};

// To see different states, you would need to mock the API responses
// Consider adding MSW to your Storybook setup for interactive stories
export const WithMockDescription: Story = {
  args: {
    authToken: 'test-auth-token',
  },
  parameters: {
    docs: {
      description: {
        story: `
This component displays a user's enrolled courses, separated into:
- **In Progress**: Active courses the user is currently taking
- **Completed**: Courses where the user has received a certificate

The component fetches data from two endpoints:
- \`/api/course-registrations\`: User's course enrollments
- \`/api/courses\`: Course details

Each course row is rendered using the CourseListRow component.
        `,
      },
    },
  },
};
