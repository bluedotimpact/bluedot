// TODO: remove. Added for debugging — captures how the legacy DiscussionList row
// (with the NOW/LIVE TimeWidget) looked before the v2 my-courses redesign, so we can
// compare against DiscussionListRow.stories.tsx in components/my-courses/.
import type { Course } from '@bluedot/db';
import type { Meta, StoryObj } from '@storybook/react';
import DiscussionList, { TimeWidget } from './DiscussionList';
import type { GroupDiscussionWithGroupAndUnit } from '../../server/routers/group-discussions';

const NOW_SEC = Math.floor(Date.now() / 1000);
const IN_5_MIN = NOW_SEC + 5 * 60;
const IN_3_DAYS = NOW_SEC + 3 * 24 * 60 * 60;
const TWO_HOURS = 2 * 60 * 60;

const course = {
  id: 'course-1',
  slug: 'technical-ai-safety',
  title: 'Technical AI Safety',
} as unknown as Course;

const makeDiscussion = (overrides: Record<string, unknown>): GroupDiscussionWithGroupAndUnit => ({
  id: 'disc-default',
  startDateTime: IN_3_DAYS,
  endDateTime: IN_3_DAYS + TWO_HOURS,
  unitNumber: 4,
  unitRecord: { unitNumber: 4, title: 'Detecting danger' },
  unitFallback: 4,
  zoomLink: 'https://zoom.us/j/000',
  slackChannelId: 'C01ABCDEF',
  activityDoc: 'https://example.com/discussion-doc',
  group: 'group-1',
  ...overrides,
} as unknown as GroupDiscussionWithGroupAndUnit);

const noop = () => {};

const baseListProps = {
  course,
  isFacilitator: false,
  isPast: false,
  emptyMessage: 'No discussions',
  onOpenGroupSwitchModal: noop,
  onOpenFacilitatorModal: noop,
  onOpenDropoutModal: noop,
};

const meta = {
  title: 'website/legacy/DiscussionList (TODO: remove)',
  component: DiscussionList,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DiscussionList>;

export default meta;
type Story = StoryObj<typeof meta>;

// The visual difference everyone keeps asking about: legacy renders a NOW + filled-blue
// LIVE chip when the discussion is currently happening, vs a plain date+time block otherwise.
export const TimeWidgetStates: Story = {
  args: { ...baseListProps, discussions: [] },
  render: () => (
    <div className="flex gap-4">
      <div className="flex flex-col items-center gap-2">
        <span className="text-size-xs text-gray-500">Not live</span>
        <TimeWidget isLive={false} dateTimeSeconds={IN_3_DAYS} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-size-xs text-gray-500">Live</span>
        <TimeWidget isLive dateTimeSeconds={NOW_SEC} />
      </div>
    </div>
  ),
};

// First row is "next" (within 1 hour of now → "Join now" + relative "Starts in N minutes").
export const NextDiscussionSoon: Story = {
  args: {
    ...baseListProps,
    discussions: [
      makeDiscussion({ id: 'd-1', startDateTime: IN_5_MIN, endDateTime: IN_5_MIN + TWO_HOURS }),
      makeDiscussion({
        id: 'd-2', startDateTime: IN_3_DAYS, endDateTime: IN_3_DAYS + TWO_HOURS, unitNumber: 5, unitRecord: { unitNumber: '5', title: 'Risks from misalignment' },
      }),
    ],
  },
};

// First row is currently live (started 10 minutes ago, ends in ~110 minutes). TimeWidget
// flips to NOW/LIVE; primary CTA becomes "Join now".
export const NextDiscussionLive: Story = {
  args: {
    ...baseListProps,
    discussions: [
      makeDiscussion({ id: 'd-1', startDateTime: NOW_SEC - 10 * 60, endDateTime: NOW_SEC + 110 * 60 }),
      makeDiscussion({
        id: 'd-2', startDateTime: IN_3_DAYS, endDateTime: IN_3_DAYS + TWO_HOURS, unitNumber: 5, unitRecord: { unitNumber: '5', title: 'Risks from misalignment' },
      }),
    ],
  },
};

// First row is far enough in the future that legacy shows "Prepare for discussion" instead of "Join now".
export const NextDiscussionFarFuture: Story = {
  args: {
    ...baseListProps,
    discussions: [
      makeDiscussion({ id: 'd-1', startDateTime: IN_3_DAYS, endDateTime: IN_3_DAYS + TWO_HOURS }),
      makeDiscussion({
        id: 'd-2', startDateTime: IN_3_DAYS + 7 * 24 * 60 * 60, endDateTime: IN_3_DAYS + 7 * 24 * 60 * 60 + TWO_HOURS, unitNumber: 5, unitRecord: { unitNumber: '5', title: 'Risks from misalignment' },
      }),
    ],
  },
};

// All discussions in the past — no primary CTA, no "Can't make it?", just unit labels and overflow.
export const PastDiscussions: Story = {
  args: {
    ...baseListProps,
    isPast: true,
    discussions: [
      makeDiscussion({ id: 'd-1', startDateTime: NOW_SEC - 14 * 24 * 60 * 60, endDateTime: NOW_SEC - 14 * 24 * 60 * 60 + TWO_HOURS }),
      makeDiscussion({
        id: 'd-2', startDateTime: NOW_SEC - 7 * 24 * 60 * 60, endDateTime: NOW_SEC - 7 * 24 * 60 * 60 + TWO_HOURS, unitNumber: 5, unitRecord: { unitNumber: '5', title: 'Risks from misalignment' },
      }),
    ],
  },
};
