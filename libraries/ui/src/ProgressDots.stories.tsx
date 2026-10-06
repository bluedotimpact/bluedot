import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { ProgressDots } from './ProgressDots';

const meta = {
  title: 'ui/ProgressDots',
  component: ProgressDots,
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

export const OnDark: Story = {
  args: {
    className: 'text-on-dark',
  },
  decorators: [
    (Story) => (
      <div className="bg-bluedot-navy p-8 rounded-surface">
        <Story />
      </div>
    ),
  ],
};

// Buttons own their busy state; see Button `loading`
export const InButton: Story = {
  render: () => (
    <Button loading>Submitting</Button>
  ),
};
