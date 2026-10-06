import type { Meta, StoryObj } from '@storybook/react';
import { CTALinkOrButton } from './CTALinkOrButton';
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

// Buttons own their busy state; see CTALinkOrButton `loading`
export const InButton: Story = {
  render: () => (
    <CTALinkOrButton loading>Submitting</CTALinkOrButton>
  ),
};
