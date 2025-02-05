import type { Meta, StoryObj } from '@storybook/react';
import GovernanceProjects from './GovernanceProjects';

const meta = {
  title: 'Homepage/GovernanceProjects',
  component: GovernanceProjects,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GovernanceProjects>;

export default meta;
type Story = StoryObj<typeof GovernanceProjects>;

export const Default: Story = {
  args: {},
};
