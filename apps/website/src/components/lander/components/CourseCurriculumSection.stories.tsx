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

const mockMetadata = [
  {
    unitId: 'unit-1', unitNumber: '1', duration: 45, exerciseCount: 2,
  },
  {
    unitId: 'unit-2', unitNumber: '2', duration: 60, exerciseCount: 3,
  },
  {
    unitId: 'unit-3', unitNumber: '3', duration: 35, exerciseCount: 1,
  },
  {
    unitId: 'unit-4', unitNumber: '4', duration: 50, exerciseCount: 2,
  },
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
        trpcStorybookMsw.courses.getCurriculumMetadata.query(() => mockMetadata),
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
        trpcStorybookMsw.courses.getCurriculumMetadata.query(() => [
          {
            unitId: 'unit-1', unitNumber: '1', duration: 30, exerciseCount: 1,
          },
        ]),
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
        trpcStorybookMsw.courses.getCurriculumMetadata.query(() => []),
      ],
    },
  },
};

export const WithDurationOnly: Story = {
  args: {
    title: 'Curriculum Overview',
    courseSlug: 'duration-only',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courses.getBySlug.query(() => ({
          course: createMockCourse({
            slug: 'duration-only',
            title: 'Duration Only Course',
          }),
          units: [
            createMockUnit({
              id: 'unit-1',
              unitNumber: '1',
              title: 'Unit with Duration Only',
              menuText: 'This unit has a duration but no exercises.',
            }),
          ],
        })),
        trpcStorybookMsw.courses.getCurriculumMetadata.query(() => [
          {
            unitId: 'unit-1', unitNumber: '1', duration: 25, exerciseCount: 0,
          },
        ]),
      ],
    },
  },
};

export const WithExercisesOnly: Story = {
  args: {
    title: 'Curriculum Overview',
    courseSlug: 'exercises-only',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courses.getBySlug.query(() => ({
          course: createMockCourse({
            slug: 'exercises-only',
            title: 'Exercises Only Course',
          }),
          units: [
            createMockUnit({
              id: 'unit-1',
              unitNumber: '1',
              title: 'Unit with Exercises Only',
              menuText: 'This unit has exercises but no duration set.',
            }),
          ],
        })),
        trpcStorybookMsw.courses.getCurriculumMetadata.query(() => [
          {
            unitId: 'unit-1', unitNumber: '1', duration: null, exerciseCount: 4,
          },
        ]),
      ],
    },
  },
};
