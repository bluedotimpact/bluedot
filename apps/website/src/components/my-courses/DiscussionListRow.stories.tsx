// TODO: remove. Added for debugging the row's per-status visual treatment;
// not intended to live long-term.
import type { GroupDiscussion, Unit } from '@bluedot/db';
import type { Meta, StoryObj } from '@storybook/react';
import DiscussionListRow from './DiscussionListRow';

const APRIL_29_4PM = Math.floor(new Date('2026-04-29T16:00:00Z').getTime() / 1000);

const discussion = {
  id: 'disc-1',
  startDateTime: APRIL_29_4PM,
  unitNumber: 4,
  zoomLink: 'https://zoom.us/j/000',
} as unknown as GroupDiscussion;

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
  discussion,
  unit,
  onReschedule: () => {},
};

export const Upcoming: Story = { args: { ...baseArgs, status: 'upcoming' } };
export const Soon: Story = { args: { ...baseArgs, status: 'soon' } };
export const Live: Story = { args: { ...baseArgs, status: 'live' } };
export const Attended: Story = { args: { ...baseArgs, status: 'attended' } };
export const Absent: Story = { args: { ...baseArgs, status: 'absent' } };

export const AllStates: Story = {
  args: { ...baseArgs, status: 'upcoming' },
  render: (args) => (
    <>
      <DiscussionListRow {...args} status="upcoming" />
      <DiscussionListRow {...args} status="soon" />
      <DiscussionListRow {...args} status="live" />
      <DiscussionListRow {...args} status="attended" />
      <DiscussionListRow {...args} status="absent" />
    </>
  ),
};
