import type { Meta, StoryObj } from '@storybook/react';

import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';

import { Button, type ButtonProps } from './Button';

const meta = {
  title: 'ui/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/s4dNR4ELGKPbja6GkHLVJy/BlueDot-design-system?node-id=1534-2',
    },
  },
  args: {
    children: 'Get started',
    variant: 'primary',
    size: 'medium',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS: NonNullable<ButtonProps['variant']>[] = ['primary', 'secondary', 'ghost', 'black', 'outline-black'];
const TONES: NonNullable<ButtonProps['tone']>[] = ['destructive', 'success', 'warning'];

// One row per variant: default · disabled · loading · with icon
const StateRow = ({ variant, tone }: Pick<ButtonProps, 'variant' | 'tone'>) => (
  <div className="flex items-center gap-4">
    <span className="w-36 text-size-xs text-secondary on-dark:text-on-dark-secondary">{tone ? `${variant} · ${tone}` : variant}</span>
    <Button variant={variant} tone={tone}>Get started</Button>
    <Button variant={variant} tone={tone} disabled>Get started</Button>
    <Button variant={variant} tone={tone} loading>Getting started</Button>
    <Button variant={variant} tone={tone}>Next <FaChevronRight aria-hidden className="size-4" /></Button>
  </div>
);

export const Primary: Story = {};

export const Link: Story = {
  args: { url: 'https://bluedot.org', children: 'Visit bluedot.org' },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {VARIANTS.map((variant) => <StateRow key={variant} variant={variant} />)}
    </div>
  ),
};

// `tone` recolours primary/secondary; other variants ignore it
export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {TONES.map((tone) => <StateRow key={tone} variant="primary" tone={tone} />)}
      {TONES.map((tone) => <StateRow key={tone} variant="secondary" tone={tone} />)}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Button size="small">Small · 36</Button>
      <Button size="medium">Medium · 44</Button>
      <Button size="large">Large · 50</Button>
    </div>
  ),
};

export const Loading: Story = {
  args: { loading: true, children: 'Submitting…' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

// Icons are plain children; the root `gap-2` spaces them
export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="secondary"><FaChevronLeft aria-hidden className="size-4" /> Back</Button>
      <Button>Next <FaChevronRight aria-hidden className="size-4" /></Button>
    </div>
  ),
};

// A dark ancestor sets `data-on-dark`; no prop on the button
export const OnDark: Story = {
  render: () => (
    <div data-on-dark className="flex flex-col gap-4 rounded-surface bg-dark p-8">
      <StateRow variant="primary" />
      <StateRow variant="secondary" />
      <StateRow variant="ghost" />
    </div>
  ),
};
