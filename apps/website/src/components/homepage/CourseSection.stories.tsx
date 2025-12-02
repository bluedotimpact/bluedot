import type { Meta, StoryObj } from '@storybook/react';
import CourseSection from './CourseSection';

const meta = {
  title: 'Website/Homepage/CourseSection',
  component: CourseSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The courses section of the homepage displaying available courses in a responsive grid (desktop) or carousel (mobile/tablet). Features value propositions and course cards with gradient backgrounds.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CourseSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
