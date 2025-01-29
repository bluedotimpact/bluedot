import type { Meta, StoryObj } from '@storybook/react';

import { withStorybookWrapper } from '../../lib/withStorybookWrapper';

import IntroSection from './IntroSection';

const meta = {
  title: 'website/IntroSection',
  component: IntroSection,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {
    title: '',
  },
  decorators: [withStorybookWrapper],
} satisfies Meta<typeof IntroSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OurCulture: Story = {
  args: {
    title: 'Our culture!',
  },
};
