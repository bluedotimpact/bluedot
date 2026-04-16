import type { Meta, StoryObj } from '@storybook/react';
import type React from 'react';
import { useState } from 'react';
import { RubricSelector } from './ParticipantFeedbackModal';

const SAMPLE_OPTIONS = [
  { value: 5, label: 'Went clearly above and beyond', description: 'Brought in outside resources, produced additional work unprompted, reached out to peers or facilitator between discussions, or demonstrated significantly more thinking than required.' },
  { value: 4, label: 'Took clear ownership of their learning', description: 'Showing up as exceptionally well-prepared contributions, thoughtful written responses, or following up on ideas between discussions.' },
  { value: 3, label: 'Consistently prepared and engaged at the expected level', description: 'Reliable participant whose contributions showed they\'d done the work.' },
  { value: 2, label: 'Inconsistently prepared', description: 'Contributions (verbal or written) didn\'t suggest much investment beyond the minimum.' },
  { value: 1, label: 'Frequently unprepared or disengaged', description: 'Little evidence of investment in the material or the cohort beyond showing up.' },
];

const RubricSelectorWrapper: React.FC = () => {
  const [value, setValue] = useState<number | null>(null);

  return (
    <RubricSelector
      name="show-up"
      label="How did they show up across discussions?"
      description="Think about preparation, initiative, and engagement between sessions."
      options={SAMPLE_OPTIONS}
      value={value}
      onChange={setValue}
    />
  );
};

const meta = {
  title: 'website/courses/RubricSelector',
  component: RubricSelectorWrapper,
  tags: ['autodocs'],
  args: {},
} satisfies Meta<typeof RubricSelectorWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const PreselectedWrapper: React.FC = () => {
  const [value, setValue] = useState<number | null>(4);

  return (
    <RubricSelector
      name="show-up"
      label="How did they show up across discussions?"
      description="Think about preparation, initiative, and engagement between sessions."
      options={SAMPLE_OPTIONS}
      value={value}
      onChange={setValue}
    />
  );
};

export const Preselected: Story = {
  render: () => <PreselectedWrapper />,
};
