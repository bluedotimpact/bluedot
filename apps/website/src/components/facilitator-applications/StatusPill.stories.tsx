import type { Meta, StoryObj } from '@storybook/react';
import StatusPill from './StatusPill';

const meta = {
  title: 'website/facilitator-applications/StatusPill',
  component: StatusPill,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof StatusPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = { args: { variant: 'pending' } };
export const Accepted: Story = { args: { variant: 'accepted' } };
export const Withdrawn: Story = { args: { variant: 'withdrawn' } };
export const NotPlaced: Story = { args: { variant: 'notPlaced' } };
