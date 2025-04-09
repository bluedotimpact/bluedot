import type { Meta, StoryObj } from '@storybook/react';

import Exercise from './Exercise';

const meta = {
  title: 'website/Exercise',
  component: Exercise,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof Exercise>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultipleChoice: Story = {
  args: {
    exercise: {
      id: 'recXvNUEwvXgCF7Qp',
      courseId: '1',
      exerciseNumber: '1',
      type: 'Multiple choice',
      title: 'Understanding LLMs',
      description: 'Why is a language model\'s ability to predict \'the next word\' capable of producing complex behaviors like solving maths problems?',
      options: [
        'The training data includes explicit instructions for these tasks',
        'The training data includes implicit instructions for these tasks',
        'The training data includes no instructions for these tasks',
      ],
      answer: 'The training data includes explicit instructions for these tasks',
      unitId: '1',
      unitNumber: '1',
    },
  },
};

export const FreeTextResponse: Story = {
  args: {
    exercise: {
      id: 'rec22HWBzsuhmk5Z2',
      courseId: '1',
      exerciseNumber: '1',
      type: 'Free text',
      title: 'Understanding LLMs',
      description: 'Why is a language model\'s ability to predict \'the next word\' capable of producing complex behaviors like solving maths problems?',
      answer: '',
      unitId: '1',
      unitNumber: '1',
      options: [],
    },
  },
};
