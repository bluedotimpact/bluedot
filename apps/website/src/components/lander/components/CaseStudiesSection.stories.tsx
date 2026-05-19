import type { Meta, StoryObj } from '@storybook/react';
import CaseStudiesSection, { type CaseStudy } from './CaseStudiesSection';

const meta = {
  title: 'website/CourseLander/CaseStudiesSection',
  component: CaseStudiesSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A two-column grid of alumni case-study cards, each with an optional headshot, name, and longer-form story about their post-course trajectory.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'Section heading',
      control: 'text',
    },
    subtitle: {
      description: 'Optional italic subtitle below the heading',
      control: 'text',
    },
    caseStudies: {
      description: 'Array of case-study cards to display',
      control: 'object',
    },
  },
} satisfies Meta<typeof CaseStudiesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleCaseStudies: CaseStudy[] = [
  {
    name: 'Janvi Ahuja',
    imageSrc: '/images/graduates/janvi-ahuja.webp',
    story: 'Janvi joined the course from a public-health background and pivoted into biosecurity policy at a major think tank. Within a year she was advising on pandemic preparedness frameworks for the WHO.',
  },
  {
    name: 'Felix Moronta',
    imageSrc: '/images/graduates/felix-moronta.webp',
    story: 'A software engineer at a fintech, Felix used the course to map out where his skills were most needed. He now builds biosecurity early-warning tools for a non-profit, funded in part by a BlueDot Career Transition Grant.',
  },
  {
    name: 'Sarah Koeller',
    imageSrc: '/images/graduates/sarah-koeller.webp',
    story: 'Sarah came in with a policy background from the State Department. She used the course to figure out where governments most need biosecurity expertise, and now leads a biosecurity portfolio at a federal agency.',
  },
  {
    name: 'Peter Ahabwe',
    imageSrc: '/images/graduates/peter-ahabwe.webp',
    story: 'Peter joined the course while completing a public-health masters in Uganda. He now leads regional pandemic-preparedness work for an African public-health institution.',
  },
];

export const Default: Story = {
  args: {
    title: 'Case studies',
    caseStudies: sampleCaseStudies,
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'Case studies',
    subtitle: 'A few alumni share where the course took them next.',
    caseStudies: sampleCaseStudies,
  },
};
