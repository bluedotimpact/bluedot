import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BugReportModal } from './BugReportModal';
import { CTALinkOrButton } from './CTALinkOrButton';

// Wrapper component to handle the modal state
const BugReportModalDemo: React.FC<{ showTextarea?: boolean }> = ({ showTextarea }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <CTALinkOrButton onClick={() => setIsOpen(true)}>
        Submit Feedback
      </CTALinkOrButton>
      <BugReportModal
        showTextarea={showTextarea}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
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
