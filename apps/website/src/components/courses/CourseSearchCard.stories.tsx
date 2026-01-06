import type { Meta, StoryObj } from '@storybook/react';
import { CourseSearchCard } from './CourseSearchCard';

const meta: Meta<typeof CourseSearchCard> = {
  title: 'website/courses/CourseSearchCard',
  component: CourseSearchCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {},
};

export default meta;
type Story = StoryObj<typeof CourseSearchCard>;

export const Default: Story = {
  args: {
    title: 'Advanced TypeScript',
    url: '/courses/advanced-typescript',
    description: 'Deep dive into advanced TypeScript features like generics, decorators, and conditional types.',
    averageRating: 4.8,
    imageSrc: '/images/courses/default.webp',
  },
};

export const Minimal: Story = {
  args: {
    title: 'Introduction to CSS Grid',
    url: '/courses/what-the-fish/image.png',
  },
};
