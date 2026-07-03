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

const furtherExercise = createMockExercise({
  id: 'exercise-further-1',
  status: 'Further',
  title: '2. Go deeper: alternative fishing regulations',
  description: 'An optional extension exercise for those who want to go further.',
});

const allExercises = [coreExercise, furtherExercise];

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
    exercises: [coreExercise],
  },
};

export const WithOptionalContent: Story = {
  args: {
    resources: [coreResource, furtherResource],
    exercises: allExercises,
  },
};
