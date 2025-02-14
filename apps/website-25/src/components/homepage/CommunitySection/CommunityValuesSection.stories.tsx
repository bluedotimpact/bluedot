import type { Meta, StoryObj } from '@storybook/react';
import CommunityValuesSection from './CommunityValuesSection';

const meta = {
  title: 'Homepage/CommunityValuesSection',
  component: CommunityValuesSection,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CommunityValuesSection>;

export default meta;
type Story = StoryObj<typeof CommunityValuesSection>;

export const Default: Story = {
  args: {},
};
