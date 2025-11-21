import type { Meta, StoryObj } from '@storybook/react';
import { ProgressDots } from './ProgressDots';

const meta = {
  title: 'ui/ProgressDots',
  component: ProgressDots,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ProgressDots>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCustomClassName: Story = {
  args: {
    className: 'bg-bluedot-normal p-4 rounded',
    dotClassName: 'bg-white',
  },
};
