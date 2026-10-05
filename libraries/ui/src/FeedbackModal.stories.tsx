import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FeedbackModal, type FeedbackModalProps } from './FeedbackModal';
import { CTALinkOrButton } from './CTALinkOrButton';

const FeedbackModalDemo: React.FC<Pick<FeedbackModalProps, 'onSubmit' | 'onRecordScreen' | 'recordingUrl' | 'defaultEmail'>> = ({
  onSubmit, onRecordScreen, recordingUrl, defaultEmail,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <CTALinkOrButton onClick={() => setIsOpen(true)}>
        Submit Feedback
      </CTALinkOrButton>
      <FeedbackModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onSubmit={onSubmit}
        onRecordScreen={onRecordScreen}
        recordingUrl={recordingUrl}
        defaultEmail={defaultEmail}
      />
    </div>
  );
};

const meta = {
  title: 'ui/FeedbackModal',
  component: FeedbackModalDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FeedbackModalDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onRecordScreen: () => { },
  },
};

export const WithVideoRecording: Story = {
  args: {
    onRecordScreen: () => { },
    recordingUrl: 'https://app.birdie.so/recording/example',
  },
};

export const LoggedIn: Story = {
  args: {
    onRecordScreen: () => { },
    defaultEmail: 'participant@example.com',
  },
};
