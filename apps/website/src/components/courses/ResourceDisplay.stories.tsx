import type { Meta, StoryObj } from '@storybook/react';
import { loggedOutStory } from '@bluedot/ui/src/utils/storybook';
import { createMockExercise, createMockResource } from '../../__tests__/testUtils';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import { ResourceDisplay } from './ResourceDisplay';

const coreResource = createMockResource({
  id: 'resource-core-1',
  resourceName: 'Introduction to AI Safety',
  coreFurtherMaybe: 'Core',
  timeFocusOnMins: 15,
});

const furtherResource = createMockResource({
  id: 'resource-further-1',
  resourceName: 'Deep dive: historical AI safety efforts',
  coreFurtherMaybe: 'Further',
  timeFocusOnMins: 20,
});

const coreExercise = createMockExercise({
  id: 'exercise-core-1',
  status: 'Core',
  title: '1. What does a better future for yourself look like?',
  description: 'Describe your ideal future in a few sentences.',
});

const activeRequiredExercise = createMockExercise({
  id: 'exercise-active-1',
  status: 'Active',
  isOptional: false,
  title: '2. What drove the shift from cod to shrimp fishing?',
  description: 'Select the most accurate answer based on the reading.',
});

const furtherExercise = createMockExercise({
  id: 'exercise-further-1',
  status: 'Further',
  title: '3. Go deeper: alternative fishing regulations',
  description: 'An optional extension exercise for those who want to go further.',
});

const activeOptionalExercise = createMockExercise({
  id: 'exercise-active-opt-1',
  status: 'Active',
  isOptional: true,
  title: '4. Optional: reflect on your own community',
  description: 'How do the dynamics from this unit show up in a community you are part of?',
});

const allExercises = [coreExercise, activeRequiredExercise, furtherExercise, activeOptionalExercise];

const handlers = [
  trpcStorybookMsw.exercises.getExercise.query(({ input }) => allExercises.find((e) => e.id === input.exerciseId)!),
  trpcStorybookMsw.exercises.getExerciseResponse.query(() => null),
  trpcStorybookMsw.exercises.getGroupExerciseResponses.query(() => null),
];

const meta: Meta<typeof ResourceDisplay> = {
  title: 'website/courses/ResourceDisplay',
  component: ResourceDisplay,
  parameters: {
    layout: 'padded',
    nextjs: {
      router: {
        query: { courseSlug: 'test-course' },
      },
    },
    msw: {
      handlers,
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    unitTitle: 'Introduction to AI Safety',
    unitNumber: '1',
    courseSlug: 'test-course',
    chunkIndex: 0,
  },
  ...loggedOutStory(),
};

export default meta;
type Story = StoryObj<typeof ResourceDisplay>;

export const Default: Story = {
  args: {
    resources: [coreResource],
    exercises: [coreExercise, activeRequiredExercise],
  },
};

export const WithOptionalContent: Story = {
  args: {
    resources: [coreResource, furtherResource],
    exercises: allExercises,
  },
};
