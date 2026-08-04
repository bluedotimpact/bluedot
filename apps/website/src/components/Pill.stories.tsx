import type { Meta, StoryObj } from '@storybook/react';
import { Pill } from './Pill';

const meta = {
  title: 'website/Pill',
  component: Pill,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Small uppercase pill used as a row label in marketing schedule/logistics lists (e.g. incubator week, fieldbuilder week, career transition grant).',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Pill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Mon–Tue',
  },
};
