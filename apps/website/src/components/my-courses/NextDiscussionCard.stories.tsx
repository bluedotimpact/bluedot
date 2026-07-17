import type { Group } from '@bluedot/db';
import type { Meta, StoryObj } from '@storybook/react';
import { H2 } from '@bluedot/ui';
import { createMockGroupDiscussion, createMockUnit } from '../../__tests__/testUtils';
import NextDiscussionCard from './NextDiscussionCard';

const ONE_HOUR_SECS = 60 * 60;
const nowSec = Math.floor(Date.now() / 1000);

const unit = createMockUnit({ unitNumber: '3', title: 'Detecting danger' });

const meta = {
  title: 'website/my-courses/NextDiscussionCard',
  component: NextDiscussionCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    courseSlug: 'technical-ai-safety',
    courseTitle: 'Technical AI Safety',
    unit,
  },
} satisfies Meta<typeof NextDiscussionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const nextDiscussion = createMockGroupDiscussion({
  startDateTime: nowSec + 26 * ONE_HOUR_SECS,
  endDateTime: nowSec + 27 * ONE_HOUR_SECS,
});

const liveDiscussion = createMockGroupDiscussion({
  startDateTime: nowSec - 10 * 60,
  endDateTime: nowSec + 50 * 60,
  zoomLink: 'https://zoom.us/j/123',
});

const facilitatorGroup = {
  id: 'group-9', groupNumber: 9, groupName: 'Group 9', discussionDoc: 'https://example.com/discussion-doc', slackChannelId: 'C01ABC',
} as Group;
const facilitatorSubtitle = 'Week 18 Intensive Group 9';

export const AllStates: Story = {
  args: { discussion: nextDiscussion },
  render: (args) => (
    <div>
      <H2 className="mb-3 text-size-sm">Next discussions</H2>
      <div className="flex flex-col gap-3">
        <NextDiscussionCard {...args} discussion={liveDiscussion} />
        <NextDiscussionCard {...args} discussion={nextDiscussion} />
      </div>
    </div>
  ),
};

export const AllFacilitatorStates: Story = {
  args: { discussion: nextDiscussion },
  render: (args) => (
    <div>
      <H2 className="mb-3 text-size-sm">Next discussions</H2>
      <div className="flex flex-col gap-3">
        <NextDiscussionCard {...args} mode="facilitator" discussion={liveDiscussion} group={facilitatorGroup} facilitatorSubtitle={facilitatorSubtitle} />
        <NextDiscussionCard {...args} mode="facilitator" discussion={nextDiscussion} group={facilitatorGroup} facilitatorSubtitle={facilitatorSubtitle} />
      </div>
    </div>
  ),
};

export const Next: Story = {
  args: { discussion: nextDiscussion },
};

export const Live: Story = {
  args: { discussion: liveDiscussion },
};

export const FacilitatorNext: Story = {
  args: {
    discussion: nextDiscussion, mode: 'facilitator', group: facilitatorGroup, facilitatorSubtitle,
  },
};

export const FacilitatorLive: Story = {
  args: {
    discussion: liveDiscussion, mode: 'facilitator', group: facilitatorGroup, facilitatorSubtitle,
  },
};
