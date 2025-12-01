import type { Meta, StoryObj } from '@storybook/react';
import GraduateSection from './GraduateSection';

const meta = {
  title: 'website/CourseLander/GraduateSection',
  component: GraduateSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A responsive section displaying an infinite-scrolling carousel of company logos where BlueDot alumni work. Features a fade mask effect and auto-scrolling animation.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GraduateSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
