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
    options: 'The community\'s preference for low-tech fishing traditions\nRising consumer demand for fish with more Omega-3s\nEnvironmental regulations and declining cod stocks\nA cultural shift toward vegetarianism in the region\n',
    answer: 'The community\'s preference for low-tech fishing traditions\n',
    onExerciseSubmit: () => {},
  },
};

export const LoggedIn: Story = {
  args: {
    ...Default.args,
    isLoggedIn: true,
  },
};

export const SavedCorrectResponse: Story = {
  args: {
    ...Default.args,
    exerciseResponse: Default.args.answer,
    isLoggedIn: true,
  },
};

export const SavedIncorrectResponse: Story = {
  args: {
    ...Default.args,
    exerciseResponse: 'A cultural shift toward vegetarianism in the region\n',
    isLoggedIn: true,
  },
};
