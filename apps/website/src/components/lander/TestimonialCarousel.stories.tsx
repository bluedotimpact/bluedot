import type { Meta, StoryObj } from '@storybook/react';
import TestimonialCarousel, { type TestimonialMember } from './TestimonialCarousel';

const meta = {
  title: 'website/CourseLander/TestimonialCarousel',
  component: TestimonialCarousel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A full-bleed horizontally scrolling carousel of testimonial / alumni cards. Triplicates the list for infinite-loop scrolling once there are enough cards to overflow the viewport. The `homepage` variant uses a slightly larger, lighter-weight heading; the `lander` variant fits within a course landing page.',
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
      description: 'Optional section title; falls back to a variant-appropriate default',
      control: 'text',
    },
    subtitle: {
      description: 'Optional subtitle shown below the title',
      control: 'text',
    },
    variant: {
      description: 'Visual variant: `homepage` or `lander`',
      control: 'inline-radio',
      options: ['homepage', 'lander'],
    },
    hideQuotes: {
      description: 'If true, shows only image + name + role on each card',
      control: 'boolean',
    },
  },
} satisfies Meta<typeof TestimonialCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleTestimonials: TestimonialMember[] = [
  {
    name: 'Adam Jones',
    jobTitle: 'Research Engineer, Anthropic',
    quote: 'BlueDot was the on-ramp into AI safety I needed. The course gave me the technical vocabulary, the network, and the confidence to pivot from product engineering into alignment research.',
    imageSrc: '/images/graduates/adam.webp',
    url: 'https://example.com/adam',
  },
  {
    name: 'Ana Rodriguez',
    jobTitle: 'Policy Lead, UK AISI',
    quote: 'I came in from a government policy background and left with a sharper sense of where technical evaluations connect to policy levers. The cohort itself was the most useful part.',
    imageSrc: '/images/graduates/ana.webp',
  },
  {
    name: 'Belle Chen',
    jobTitle: 'Founder, Safe Systems Lab',
    quote: 'Within six months of finishing the course I had co-founded a small research lab focused on dangerous-capability evaluations.',
    imageSrc: '/images/graduates/belle.webp',
    url: 'https://example.com/belle',
  },
  {
    name: 'Cameron Patel',
    jobTitle: 'PhD Student, MILA',
    quote: 'The course directly shaped my PhD research agenda on mechanistic interpretability. I now know which open problems matter and which are dead ends.',
    imageSrc: '/images/graduates/cameron.webp',
  },
  {
    name: 'Catherine Nguyen',
    jobTitle: 'Senior Engineer, Google DeepMind',
    quote: 'I left with a map of the broader safety landscape and the confidence to advocate internally for more investment in evals and red-teaming.',
    imageSrc: '/images/graduates/catherine.webp',
  },
  {
    name: 'Chiara Rossi',
    jobTitle: 'Policy Analyst, OECD',
    quote: 'The course is rigorous without being dry. I now help shape international AI policy at the OECD.',
    imageSrc: '/images/graduates/chiara.webp',
  },
];

export const Default: Story = {
  args: {
    testimonials: sampleTestimonials,
    variant: 'homepage',
    subtitle: 'Learn more about the incredible work our community is doing.',
    hideQuotes: true,
  },
};

export const LanderVariant: Story = {
  args: {
    testimonials: sampleTestimonials,
    title: 'Meet our alumni shaping AI\'s future',
    variant: 'lander',
  },
};

export const WithQuotes: Story = {
  args: {
    testimonials: sampleTestimonials,
    title: 'Our community',
    variant: 'homepage',
  },
};

export const FewTestimonials: Story = {
  args: {
    testimonials: sampleTestimonials.slice(0, 2),
    title: 'Our community',
    variant: 'homepage',
  },
};
