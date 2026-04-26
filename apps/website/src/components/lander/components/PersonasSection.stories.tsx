import type { Meta, StoryObj } from '@storybook/react';
import { FaBriefcase, FaGraduationCap, FaUsers } from 'react-icons/fa6';
import PersonasSection from './PersonasSection';

const meta = {
  title: 'website/CourseLander/PersonasSection',
  component: PersonasSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '"Who this course is for" accordion used on course landing pages. Each persona expands to reveal a description and optional "what this looks like" block. The expanded card uses `accentColor` for its background.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    accentColor: { control: 'color' },
    defaultExpandedIndex: { control: 'number' },
  },
} satisfies Meta<typeof PersonasSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const samplePersonas = [
  {
    icon: FaBriefcase,
    title: 'Mid-career professionals exploring a pivot',
    summary: 'You are five-plus years into one career and weighing whether AI safety is your next move.',
    description: 'You want a structured way to test the field without quitting your day job. The course gives you the foundational concepts, the people, and a clear next step.',
    valueProposition: 'A 4-week sprint that fits around your job, plus an alumni community that keeps the door open after.',
  },
  {
    icon: FaGraduationCap,
    title: 'Final-year students and recent graduates',
    summary: 'You are choosing your first serious job and want it to matter.',
    description: 'You have technical or policy training but no obvious AI-safety entry point. We help you find one.',
  },
  {
    icon: FaUsers,
    title: 'Researchers in adjacent fields',
    summary: 'You already do impactful work — you want to know whether to redirect it.',
    description: 'You have a track record in ML, public policy, biosecurity, or similar. The course shortens the loop between "AI safety might matter for my work" and "here is what I would do differently next quarter."',
    valueProposition: 'Direct line to BlueDot researchers and a small cohort of peers wrestling with the same question.',
  },
];

export const AgiStrategy: Story = {
  args: {
    title: 'Who this course is for',
    personas: samplePersonas,
    accentColor: '#1F588A',
    defaultExpandedIndex: 0,
    cta: {
      text: 'Apply now',
      url: 'https://example.com/apply',
    },
  },
};

export const TechnicalAISafety: Story = {
  args: {
    title: 'Who this course is for',
    personas: samplePersonas,
    accentColor: '#7E5590',
    defaultExpandedIndex: 1,
  },
};

export const WithFooterText: Story = {
  args: {
    title: 'Who this course is for',
    personas: samplePersonas.slice(0, 2),
    accentColor: '#012A07',
    defaultExpandedIndex: 0,
    footerText: 'Not sure if this is you? Email courses@bluedot.org and we will help you decide.',
  },
};
