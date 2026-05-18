import type { GroupDiscussion, Unit } from '@bluedot/db';
import type { Meta, StoryObj } from '@storybook/react';
import DiscussionListRow from './DiscussionListRow';

// Stories use real "now" — discussion start/end times are picked relative to it so each row
// renders in the desired time-state branch (upcoming / soon / live / ended).
const nowSec = Math.floor(Date.now() / 1000);
const HOUR = 60 * 60;

const baseDiscussion: GroupDiscussion = {
  id: 'disc-1',
  startDateTime: nowSec + 2 * HOUR,
  endDateTime: nowSec + 3 * HOUR,
  unitNumber: 4,
  zoomLink: 'https://zoom.us/j/000',
} as unknown as GroupDiscussion;

const at = (offsets: { start: number; end: number }): GroupDiscussion => ({
  ...baseDiscussion,
  startDateTime: nowSec + offsets.start,
  endDateTime: nowSec + offsets.end,
});

const unit = {
  unitNumber: 4,
  title: 'Detecting danger',
} as unknown as Unit;

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ul className="max-w-[720px] divide-y divide-color-divider">{children}</ul>
);

const meta = {
  title: 'website/my-courses/DiscussionListRow',
  component: DiscussionListRow,
  parameters: { layout: 'padded' },
  decorators: [(Story) => <Wrapper><Story /></Wrapper>],
} satisfies Meta<typeof DiscussionListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseArgs = {
  discussion: at({ start: 2 * HOUR, end: 3 * HOUR }),
  unit,
  courseSlug: 'technical-ai-safety',
  isAttended: false,
  canReschedule: true,
  onReschedule: () => {},
};

const upcoming = at({ start: 2 * HOUR, end: 3 * HOUR });
const soon = at({ start: 10 * 60, end: 70 * 60 });
const live = at({ start: -10 * 60, end: 50 * 60 });
const past = at({ start: -2 * HOUR, end: -HOUR });

const upcomingFac = { ...upcoming, participantsExpected: ['mp-a', 'mp-b', 'mp-c', 'mp-d', 'mp-e', 'mp-f', 'mp-g', 'mp-h'] } as GroupDiscussion;
const soonFac = { ...soon, participantsExpected: ['mp-a', 'mp-b', 'mp-c', 'mp-d', 'mp-e', 'mp-f', 'mp-g', 'mp-h'] } as GroupDiscussion;
const liveFac = { ...live, participantsExpected: ['mp-a', 'mp-b', 'mp-c', 'mp-d', 'mp-e', 'mp-f', 'mp-g', 'mp-h'] } as GroupDiscussion;
const pastFac = { ...past, participantsExpected: ['mp-a', 'mp-b', 'mp-c', 'mp-d', 'mp-e', 'mp-f', 'mp-g', 'mp-h'] } as GroupDiscussion;

const facBaseArgs = {
  ...baseArgs,
  mode: 'facilitator' as const,
  onClickFacilitatorReschedule: () => {},
  onClickFacilitatorAssignSubstitute: () => {},
  onClickViewAttendees: () => {},
};

export const AllStates: Story = {
  args: baseArgs,
  render: (args) => (
    <>
      <DiscussionListRow {...args} discussion={upcoming} />
      <DiscussionListRow {...args} discussion={soon} />
      <DiscussionListRow {...args} discussion={live} />
      <DiscussionListRow {...args} discussion={past} isAttended />
      <DiscussionListRow {...args} discussion={past} />
      <DiscussionListRow {...args} discussion={past} canReschedule={false} />
    </>
  ),
};

export const AllFacilitatorStates: Story = {
  args: facBaseArgs,
  render: (args) => (
    <>
      <DiscussionListRow {...args} discussion={upcomingFac} />
      <DiscussionListRow {...args} discussion={soonFac} />
      <DiscussionListRow {...args} discussion={liveFac} />
      <DiscussionListRow {...args} discussion={pastFac} isAttended />
    </>
  ),
};

export const Upcoming: Story = { args: { ...baseArgs, discussion: upcoming } };
export const Soon: Story = { args: { ...baseArgs, discussion: soon } };
export const Live: Story = { args: { ...baseArgs, discussion: live } };
export const Attended: Story = { args: { ...baseArgs, discussion: past, isAttended: true } };
export const Absent: Story = { args: { ...baseArgs, discussion: past } };
export const AbsentNoReschedule: Story = { args: { ...baseArgs, discussion: past, canReschedule: false } };

export const FacilitatorUpcoming: Story = { args: { ...facBaseArgs, discussion: upcomingFac } };
export const FacilitatorSoon: Story = { args: { ...facBaseArgs, discussion: soonFac } };
export const FacilitatorLive: Story = { args: { ...facBaseArgs, discussion: liveFac } };
export const FacilitatorPastFacilitated: Story = { args: { ...facBaseArgs, discussion: pastFac, isAttended: true } };
