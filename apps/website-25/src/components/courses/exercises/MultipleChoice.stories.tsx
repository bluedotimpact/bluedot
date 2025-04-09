import type { Meta, StoryObj } from '@storybook/react';

import MultipleChoice from './MultipleChoice';

const meta = {
  title: 'website/courses/MultipleChoice',
  component: MultipleChoice,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof MultipleChoice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Understanding LLMs',
    description: 'Why is a language model\'s ability to predict \'the next word\' capable of producing complex behaviors like solving maths problems?',
    options: [
      'The training data includes explicit instructions for these tasks',
      'The training data includes implicit instructions for these tasks',
      'The training data includes no instructions for these tasks',
    ],
    answer: 'The training data includes explicit instructions for these tasks',
  },
};
