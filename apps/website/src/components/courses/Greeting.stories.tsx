import type { Meta, StoryObj } from '@storybook/react';

import Greeting from './Greeting';

const meta = {
  title: 'website/Greeting',
  component: Greeting,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  args: {},
} satisfies Meta<typeof Greeting>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicGreeting: Story = {
  args: {
    children: 'World',
  },
};

export const GreetingWithJSX: Story = {
  args: {
    children: <span className="text-bluedot-normal font-bold text-size-lg">Styled Text ✨</span>,
  },
};
