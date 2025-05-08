import type { Meta, StoryObj } from '@storybook/react';

import MultiSelect from './MultiSelect';

const meta = {
  title: 'website/courses/exercises/MultiSelect',
  component: MultiSelect,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Wait, AI can do that?!',
    description: 'What are some examples of tasks AI can currently perform?',
    options: 'Write a literary short story evoking human emotions\nProduce and record a conversational podcast\nLead as your D&D dungeon master\nManage a team of human employees\nTime travel\n',
    answer: 'Write a literary short story evoking human emotions\nProduce and record a conversational podcast\nLead as your D&D dungeon master\n',
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
    exerciseResponse: 'Time travel\n',
    isLoggedIn: true,
  },
};
