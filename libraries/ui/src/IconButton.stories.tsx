import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FaEllipsisVertical } from 'react-icons/fa6';
import { IconButton } from './IconButton';
import { CloseIcon } from './icons/CloseIcon';
import { HamburgerIcon } from './icons/HamburgerIcon';

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
      {open ? <CloseIcon size={16} aria-hidden="true" /> : <HamburgerIcon aria-hidden="true" />}
    </IconButton>
  );
};

export const Toggle: Story = {
  render: () => <ToggleExample />,
};

// The design has no on-dark variant. Hover and focus tokens vanish on navy; callers override for now
export const OnDark: Story = {
  args: { className: 'text-on-dark hover:bg-surface-on-dark-subtle' },
  decorators: [
    (Story) => (
      <div className="bg-bluedot-navy p-6">
        <Story />
      </div>
    ),
  ],
};
