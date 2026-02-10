import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { IconButton, HamburgerIcon, type HamburgerButtonProps } from './IconButton';

const IconButtonWrapper: React.FC<Omit<HamburgerButtonProps, 'open' | 'setOpen'>> = (props) => {
  const [open, setOpen] = React.useState(false);
  return <IconButton {...props} open={open} setOpen={setOpen} />;
};

const meta = {
  title: 'ui/IconButton',
  component: IconButtonWrapper,
  tags: ['autodocs'],
} satisfies Meta<typeof IconButtonWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    Icon: <HamburgerIcon />,
  },
};
