import type { Meta, StoryObj } from '@storybook/react';

import { CourseCard } from './CourseCard';

const meta = {
  title: 'ui/CourseCard',
  component: CourseCard,
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
} satisfies Meta<typeof CourseCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Alignment Fast Track',
    description: 'AI systems are rapidly becoming more capable and more general. Despite AI’s potential to radically improve human society, there are still open questions about how we build AI systems that are controllable, aligned with our intentions and interpretable.',
    courseType: 'Crash course',
    imageSrc: '/images/intro-course.png',
    ctaUrl: 'https://aisafetyfundamentals.com/alignment-fast-track/',
  },
};

export const Featured: Story = {
  args: {
    title: 'AI Safety: Intro to Transformative AI',
    description: 'The risks and opportunities of advanced AI are evolving at unprecedented speed—and so is the need for capable individuals to shape its trajectory. This intensive 5-day course is for those who want to rapidly develop their understanding of transformative AI and its impact on humanity.',
    courseType: 'Crash course',
    imageSrc: '/images/alignment-course.png',
    ctaUrl: 'https://aisafetyfundamentals.com/intro-to-tai/',
    cardType: 'Featured',
  },
};
