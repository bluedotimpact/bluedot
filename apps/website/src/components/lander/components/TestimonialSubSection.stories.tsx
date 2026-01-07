import type { Meta, StoryObj } from '@storybook/react';
import TestimonialSubSection, { Testimonial } from './TestimonialSubSection';

const meta = {
  title: 'website/CourseLander/TestimonialSubSection',
  component: TestimonialSubSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A responsive grid section displaying testimonial cards from course participants. Adapts from 1 column on mobile to 3 columns on desktop.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    testimonials: {
      description: 'Array of testimonials to display',
      control: 'object',
    },
    title: {
      description: 'Optional section heading',
      control: 'text',
    },
  },
} satisfies Meta<typeof TestimonialSubSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleTestimonials: Testimonial[] = [
  {
    quote: 'This course completely changed my perspective on AI safety. The frameworks we learned are directly applicable to my work.',
    name: 'Sarah Chen',
    role: 'ML Engineer at DeepMind',
    imageSrc: '/images/graduates/neel.webp',
  },
  {
    quote: 'The community I joined through this course has been invaluable. I now have a network of like-minded professionals working on the most important problems.',
    name: 'Marcus Johnson',
    role: 'Policy Researcher at RAND',
    imageSrc: '/images/graduates/marius.webp',
  },
  {
    quote: 'After completing the course, I transitioned into AI safety research. The curriculum gave me the foundation I needed to make the switch.',
    name: 'Elena Rodriguez',
    role: 'Research Scientist at Anthropic',
    imageSrc: '/images/graduates/chiara.webp',
  },
];

export const Default: Story = {
  args: {
    testimonials: sampleTestimonials,
  },
};
