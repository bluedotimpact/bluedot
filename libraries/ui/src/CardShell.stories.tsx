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

export const Linked: Story = {
  args: {
    url: 'https://example.com',
    className: 'max-w-[360px]',
    children: 'With `url` the whole shell is one link — hover darkens the border and adds a small shadow.',
  },
};

export const CustomPadding: Story = {
  args: {
    className: 'max-w-[360px] p-0 overflow-hidden',
    children: 'Padding overridden to 0 (e.g. an accordion whose inner button carries the padding).',
  },
};
