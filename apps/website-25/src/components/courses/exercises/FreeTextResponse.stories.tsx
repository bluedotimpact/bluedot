import type { Meta, StoryObj } from '@storybook/react';

import FreeTextResponse from './FreeTextResponse';

const meta = {
  title: 'website/courses/FreeTextResponse',
  component: FreeTextResponse,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof FreeTextResponse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Understanding LLMs',
    description: 'Why is a language model\'s ability to predict \'the next word\' capable of producing complex behaviors like solving maths problems?',
  },
};
