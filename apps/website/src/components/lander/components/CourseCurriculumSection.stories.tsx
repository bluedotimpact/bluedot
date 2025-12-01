import type { Meta, StoryObj } from '@storybook/react';
import CourseCurriculumSection from './CourseCurriculumSection';
import { trpcStorybookMsw } from '../../../__tests__/trpcMswSetup.browser';
import { createMockCourse, createMockUnit } from '../../../__tests__/testUtils';

const mockUnits = [
  createMockUnit({
    id: 'unit-1',
    unitNumber: '1',
    courseUnit: 'AGI Strategy - Unit 1: Introduction to AGI',
    title: 'Introduction to AGI',
    menuText: 'Explore the foundations of Artificial General Intelligence, including definitions, current progress, and key players in the field.',
  }),
  createMockUnit({
    id: 'unit-2',
    unitNumber: '2',
    courseUnit: 'AGI Strategy - Unit 2: Strategic Landscape',
    title: 'Strategic Landscape',
    menuText: 'Analyze the competitive dynamics between major AI labs, nation-states, and the geopolitical implications of AGI development.',
  }),
  createMockUnit({
    id: 'unit-3',
    unitNumber: '3',
    courseUnit: 'AGI Strategy - Unit 3: Risk Assessment',
    title: 'Risk Assessment',
    menuText: 'Learn frameworks for assessing catastrophic and existential risks from advanced AI systems.',
  }),
  createMockUnit({
    id: 'unit-4',
    unitNumber: '4',
    courseUnit: 'AGI Strategy - Unit 4: Intervention Design',
    title: 'Intervention Design',
    menuText: 'Design effective interventions using defence-in-depth strategies and kill chain analysis.',
  }),
];

const mockCourse = createMockCourse({
  slug: 'agi-strategy',
  title: 'AGI Strategy',
});

const meta = {
  title: 'website/CourseLander/CourseCurriculumSection',
  component: CourseCurriculumSection,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    title: {
      description: 'Section heading text',
      control: 'text',
    },
    courseSlug: {
      description: 'Course slug used to fetch curriculum data from the API',
      control: 'text',
    },
  },
} satisfies Meta<typeof CourseCurriculumSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Curriculum Overview',
    courseSlug: 'agi-strategy',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courses.getBySlug.query(() => ({
          course: mockCourse,
          units: mockUnits,
        })),
      ],
    },
  },
};

export const SingleUnit: Story = {
  args: {
    title: 'Curriculum Overview',
    courseSlug: 'intro-course',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courses.getBySlug.query(() => ({
          course: createMockCourse({
            slug: 'intro-course',
            title: 'Introduction Course',
          }),
          units: [
            createMockUnit({
              id: 'unit-1',
              unitNumber: '1',
              courseUnit: 'Intro Course - Unit 1: Getting Started',
              title: 'Getting Started',
              menuText: 'An introduction to the key concepts and frameworks covered in this course.',
            }),
          ],
        })),
      ],
    },
  },
};

export const Empty: Story = {
  args: {
    title: 'Curriculum Overview',
    courseSlug: 'empty-course',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courses.getBySlug.query(() => ({
          course: createMockCourse({
            slug: 'empty-course',
            title: 'Empty Course',
          }),
          units: [],
        })),
      ],
    },
  },
};
