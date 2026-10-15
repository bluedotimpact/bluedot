import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FaBars, FaEllipsisVertical, FaXmark } from 'react-icons/fa6';
import { IconButton } from './IconButton';

const meta = {
  title: 'ui/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: {
    'aria-label': 'More options',
    children: <FaEllipsisVertical className="size-4" aria-hidden="true" />,
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Outline: Story = {
  args: { variant: 'outline' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

// Toggled has no distinct styling in the design; the caller swaps the glyph and sets aria-expanded
const ToggleExample = () => {
  const [open, setOpen] = useState(false);
  return (
    <IconButton
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      onClick={() => setOpen((prev) => !prev)}
    >
      {open ? <FaXmark aria-hidden="true" className="size-4" /> : <FaBars aria-hidden="true" className="size-4" />}
    </IconButton>
  );
};

export const Toggle: Story = {
  render: () => <ToggleExample />,
};

// A `data-on-dark` ancestor (or the button itself) switches hover and focus to the on-dark recipe
export const OnDark: Story = {
  decorators: [
    (Story) => (
      <div data-on-dark className="bg-bluedot-navy p-6">
        <Story />
      </div>
    ),
  ],
};
