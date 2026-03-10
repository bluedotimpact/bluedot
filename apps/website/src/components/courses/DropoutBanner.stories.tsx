import type { Meta, StoryObj } from '@storybook/react';
import DropoutBanner from './DropoutBanner';

const meta = {
  title: 'website/courses/DropoutBanner',
  component: DropoutBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof DropoutBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    applicantId: 'rec123456789',
  },
};
