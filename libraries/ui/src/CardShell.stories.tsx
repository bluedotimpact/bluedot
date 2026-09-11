import type { Meta, StoryObj } from '@storybook/react';
import { CardShell } from './Card';

const meta = {
  title: 'ui/CardShell',
  component: CardShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CardShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: 'max-w-[360px]',
    children: 'A static card-shaped container: surface/raised, border/subtle, radius/surface, 24px padding.',
  },
};

export const NoPadding: Story = {
  args: {
    className: 'max-w-[360px] p-0 overflow-hidden',
    children: 'className="p-0" for shells whose inner element carries the padding (accordion rows).',
  },
};
