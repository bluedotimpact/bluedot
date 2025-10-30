import type { Meta, StoryObj } from '@storybook/react';
import CoursesContent from './CoursesContent';

const meta: Meta<typeof CoursesContent> = {
  title: 'Settings/CoursesContent',
  component: CoursesContent,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic story showing the component structure
// In a real environment, this would fetch data from the API endpoints
export const Default: Story = {
};

// To see different states, you would need to mock the API responses
// Consider adding MSW to your Storybook setup for interactive stories
export const WithMockDescription: Story = {
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
