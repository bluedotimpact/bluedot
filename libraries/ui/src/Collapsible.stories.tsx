import type { Meta, StoryObj } from '@storybook/react';

import { Collapsible } from './Collapsible';

const meta = {
  title: 'ui/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Is this collapsible?',
    children: <p>Yes, it is!</p>,
  },
};

export const Stacked: Story = {
  args: {
    title: 'Introductions to AI safety',
    children: <p>Start here if you are new to the field.</p>,
  },
  render: (args) => (
    <div>
      <Collapsible {...args} />
      <Collapsible title="Introductions to ML engineering">
        <p>Practical resources for building models.</p>
      </Collapsible>
      <Collapsible title="Podcasts and newsletters">
        <p>Stay up to date with the field.</p>
      </Collapsible>
    </div>
  ),
};
