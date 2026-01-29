import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { cn } from '@bluedot/ui';
import GroupResponses, { type GroupResponsesProps } from './GroupResponses';

const meta: Meta<typeof GroupResponses> = {
  title: 'Exercises/GroupResponses',
  component: GroupResponses,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GroupResponses>;

const longResponse = `A better future means access to meaningful work and stronger local institutions. I'd love to see more investment in public infrastructure — not just roads and transit, but libraries, community centres, and green spaces that bring people together. I think technology can help here, but only if we're intentional about how we deploy it. Too often we optimise for efficiency at the expense of human connection. I'd also like to see education systems that teach critical thinking and adaptability rather than rote memorisation. The pace of change is accelerating, and we need people who can navigate uncertainty with confidence. Ultimately, I think a better future is one where people have more agency over their own lives — more time, more autonomy, and more opportunities to contribute to something larger than themselves.`;

const shortResponse = 'I think the most important thing is reducing the barriers to cooperation across borders. Many of our biggest challenges are global, but our institutions are still largely national.';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <span className="text-[13px] text-[#6B7280]">Show my response</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-bluedot-normal' : 'bg-[#D1D5DB]',
      )}
    >
      <span className={cn(
        'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200',
        checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
      )} />
    </button>
  </label>
);

/** Wrapper that manages "Show my response" toggle state */
const WithToggleWrapper: React.FC<Omit<GroupResponsesProps, 'headerControls'>> = (props) => {
  const [showMyResponse, setShowMyResponse] = useState(false);

  const header = (
    <div className="flex items-center justify-between">
      <span className="text-[14px] font-bold text-[#111827]">Exercise</span>
      <ToggleSwitch checked={showMyResponse} onChange={setShowMyResponse} />
    </div>
  );

  if (showMyResponse) {
    return (
      <div className="flex flex-col gap-2">
        {header}
        <div className="container-lined bg-white p-8 flex flex-col gap-4">
          <p className="bluedot-h4 not-prose">{props.title}</p>
          <p className="text-[14px] text-[#6B7280] italic">Your response would appear here.</p>
        </div>
      </div>
    );
  }

  return <GroupResponses {...props} headerControls={header} />;
};

export const Default: Story = {
  render: () => (
    <WithToggleWrapper
      title="1. What does a better future for yourself look like?"
      description="In this exercise, describe your ideal future. Think about how society has been transformed by the past few centuries. In many ways, perhaps most, it's been for the better."
      totalParticipants={5}
      responses={[
        { name: 'Alice Thompson', response: longResponse },
        { name: 'Ben Rivera', response: shortResponse },
        { name: 'Priya Sharma', response: 'I want a future where scientific research is better funded and more accessible. Open-access publishing and international collaboration could accelerate progress on climate, health, and energy.' },
      ]}
    />
  ),
};

export const WithGroupDropdown: Story = {
  render: () => (
    <WithToggleWrapper
      title="1. What does a better future for yourself look like?"
      description="In this exercise, describe your ideal future."
      totalParticipants={4}
      groups={[
        { id: '1', name: 'Group 01 - Alice Thompson' },
        { id: '2', name: 'Group 02 - Carlos Mendez' },
        { id: '3', name: 'Group 03 - Fatima Al-Rashid' },
      ]}
      selectedGroupId="2"
      responses={[
        { name: 'Alice Thompson', response: longResponse },
        { name: 'Ben Rivera', response: shortResponse },
      ]}
    />
  ),
};

export const SingleResponse: Story = {
  render: () => (
    <WithToggleWrapper
      title="1. What does a better future for yourself look like?"
      description="In this exercise, describe your ideal future."
      totalParticipants={3}
      responses={[
        { name: 'Alice Thompson', response: shortResponse },
      ]}
    />
  ),
};

export const EmptyResponses: Story = {
  render: () => (
    <WithToggleWrapper
      title="1. What does a better future for yourself look like?"
      description="In this exercise, describe your ideal future."
      totalParticipants={4}
      responses={[]}
    />
  ),
};
