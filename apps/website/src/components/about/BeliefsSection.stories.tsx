import type { Meta, StoryObj } from '@storybook/react';

import BeliefsSection from './BeliefsSection';

const meta = {
  title: 'website/BeliefsSection',
  component: BeliefsSection,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof BeliefsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
