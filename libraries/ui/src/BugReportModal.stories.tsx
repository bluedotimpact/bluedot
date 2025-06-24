import type { Meta, StoryObj } from '@storybook/react';
import { BugReportModal } from './BugReportModal';

// Wrapper component to handle the modal state
const BugReportModalDemo: React.FC<{ showTextarea?: boolean }> = ({ showTextarea }) => {
  return (
    <div>
      <BugReportModal showTextarea={showTextarea} />
    </div>
  );
};

const meta = {
  title: 'ui/BugReportModal',
  component: BugReportModalDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof BugReportModalDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showTextarea: false,
  },
};

export const WithTextarea: Story = {
  args: {
    showTextarea: true,
  },
};
