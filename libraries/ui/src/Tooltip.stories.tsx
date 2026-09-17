import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'ui/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  args: {
    'aria-label': 'Show more information',
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: 'This is a helpful tooltip that provides additional information to the user.',
  },
};

export const CustomTrigger: Story = {
  args: {
    content: 'This tooltip has a custom text trigger.',
    children: <span className="underline underline-offset-2">What does this mean?</span>,
  },
};

export const Placements: Story = {
  args: {
    content: 'Flips to the opposite side when it would leave the viewport.',
  },
  render: (args) => (
    <div className="mx-auto grid w-fit grid-cols-2 gap-16 py-32">
      {(['top', 'bottom', 'left', 'right'] as const).map((placement) => (
        <div key={placement} className="flex items-center gap-2">
          <Tooltip {...args} placement={placement} aria-label={`Show ${placement} tooltip`} />
          <span className="text-size-xs text-secondary">{placement}</span>
        </div>
      ))}
    </div>
  ),
};
