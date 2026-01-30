import type { Meta, StoryObj } from '@storybook/react';

import MultipleChoice from './MultipleChoice';

const meta = {
  title: 'website/courses/MultipleChoice',
  component: MultipleChoice,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof MultipleChoice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: 'The community\'s preference for low-tech fishing traditions\nRising consumer demand for fish with more Omega-3s\nEnvironmental regulations and declining cod stocks\nA cultural shift toward vegetarianism in the region\n',
    answer: 'The community\'s preference for low-tech fishing traditions\n',
    onExerciseSubmit: () => Promise.resolve(),
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

export const LongOptions: Story = {
  args: {
    ...Default.args,
    options: 'Option 1: Something short.\nOption 2: Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\nOption 3: Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\nOption 4: Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n',
    answer: 'Option 2: Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n',
  },
};
