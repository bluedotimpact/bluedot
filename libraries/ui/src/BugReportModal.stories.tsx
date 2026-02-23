import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BugReportModal, type BugReportModalProps } from './BugReportModal';
import { CTALinkOrButton } from './CTALinkOrButton';

const BugReportModalDemo: React.FC<Pick<BugReportModalProps, 'onSubmit'>> = ({ onSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <CTALinkOrButton onClick={() => setIsOpen(true)}>
        Submit Feedback
      </CTALinkOrButton>
      <BugReportModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onSubmit={onSubmit}
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
  args: {},
};

export const SuccessState: Story = {
  args: {
    onSubmit: async () => {},
  },
};
