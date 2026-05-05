import type { Meta, StoryObj } from '@storybook/react';
import CourseValueProps from './CourseValueProps';

const meta = {
  title: 'Website/Homepage/CourseValueProps',
  component: CourseValueProps,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '"Start making an impact today" header plus three value-prop tiles (career, recognition, community). Sits between the hero and the three-rung ladder on the homepage.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CourseValueProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
