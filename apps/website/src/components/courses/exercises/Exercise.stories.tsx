import type { Meta, StoryObj } from '@storybook/react';
import { loggedInStory, loggedOutStory } from '@bluedot/ui/src/utils/storybook';
import { trpcStorybookMsw } from '../../../__tests__/trpcMswSetup.browser';
import Exercise from './Exercise';

const EXERCISE_ID = 'exercise-1';

const freeTextExercise = {
  id: EXERCISE_ID,
  type: 'Free text',
  title: '1. What does a better future for yourself look like?',
  description: 'In this exercise, describe your ideal future. Think about how society has been transformed by the past few centuries. In many ways, perhaps most, it\'s been for the better.',
  answer: null,
  options: null,
  courseIdWrite: 'course-1',
  courseIdRead: 'course-1',
  unitId: 'unit-1',
  status: null,
  unitNumber: null,
  exerciseNumber: null,
};

const multipleChoiceExercise = {
  id: EXERCISE_ID,
  type: 'Multiple choice',
  title: '2. What drove the shift from cod to shrimp fishing?',
  description: 'Select the most accurate answer based on the reading.',
  answer: 'Environmental regulations and declining cod stocks\n',
  options: 'The community\'s preference for low-tech fishing traditions\nRising consumer demand for fish with more Omega-3s\nEnvironmental regulations and declining cod stocks\nA cultural shift toward vegetarianism in the region\n',
  courseIdWrite: 'course-1',
  courseIdRead: 'course-1',
  unitId: 'unit-1',
  status: null,
  unitNumber: null,
  exerciseNumber: null,
};

const savedResponse = {
  id: 'response-1',
  email: 'test+storybook@bluedot.org',
  exerciseId: EXERCISE_ID,
  response: 'I believe a better future involves more equitable access to education and healthcare globally.',
  completed: false,
  autoNumberId: null,
};

const longResponse = 'A better future means access to meaningful work and stronger local institutions. I\'d love to see more investment in public infrastructure — not just roads and transit, but libraries, community centres, and green spaces that bring people together. I think technology can help here, but only if we\'re intentional about how we deploy it. Too often we optimise for efficiency at the expense of human connection. I\'d also like to see education systems that teach critical thinking and adaptability rather than rote memorisation. The pace of change is accelerating, and we need people who can navigate uncertainty with confidence. Ultimately, I think a better future is one where people have more agency over their own lives — more time, more autonomy, and more opportunities to contribute to something larger than themselves.';

const shortResponse = 'I think the most important thing is reducing the barriers to cooperation across borders. Many of our biggest challenges are global, but our institutions are still largely national.';

const groupResponsesData = {
  groups: [
    {
      id: '1',
      name: 'Group 01 - Alice Thompson',
      totalParticipants: 5,
      responses: [
        { name: 'Alice Thompson', response: longResponse },
        { name: 'Ben Rivera', response: shortResponse },
        { name: 'Priya Sharma', response: 'I want a future where scientific research is better funded and more accessible.' },
      ],
    },
    {
      id: '2', name: 'Group 02 - Carlos Mendez', totalParticipants: 4, responses: [],
    },
  ],
};

const defaultHandlers = [
  trpcStorybookMsw.exercises.getExercise.query(() => freeTextExercise),
  trpcStorybookMsw.exercises.getExerciseResponse.query(() => null),
  trpcStorybookMsw.exercises.getGroupExerciseResponses.query(() => null),
  trpcStorybookMsw.exercises.saveExerciseResponse.mutation(() => savedResponse),
];

const meta: Meta<typeof Exercise> = {
  title: 'Exercises/Exercise',
  component: Exercise,
  parameters: {
    layout: 'padded',
    nextjs: {
      router: {
        query: { courseSlug: 'test-course' },
      },
    },
    msw: {
      handlers: defaultHandlers,
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
    exerciseId: EXERCISE_ID,
  },
  ...loggedOutStory(),
};

export default meta;
type Story = StoryObj<typeof Exercise>;

export const FreeTextLoggedOut: Story = {};

export const FreeTextLoggedIn: Story = {
  ...loggedInStory(),
};

export const FreeTextWithSavedResponse: Story = {
  ...loggedInStory(),
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.exercises.getExerciseResponse.query(() => savedResponse),
        ...defaultHandlers,
      ],
    },
  },
};

export const FreeTextCompleted: Story = {
  ...loggedInStory(),
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.exercises.getExerciseResponse.query(() => ({ ...savedResponse, completed: true })),
        ...defaultHandlers,
      ],
    },
  },
};

export const MultipleChoice: Story = {
  ...loggedInStory(),
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.exercises.getExercise.query(() => multipleChoiceExercise),
        ...defaultHandlers,
      ],
    },
  },
};

export const FacilitatorView: Story = {
  ...loggedInStory(),
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.exercises.getExerciseResponse.query(() => savedResponse),
        trpcStorybookMsw.exercises.getGroupExerciseResponses.query(() => groupResponsesData),
        ...defaultHandlers,
      ],
    },
  },
};
