import type { Meta, StoryObj } from '@storybook/react';
import { createMockGroup, createMockGroupDiscussion, createMockUnit } from '../../__tests__/testUtils';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import FacilitatedCoursesPage from '../../pages/facilitated-courses';
import type { FacilitatorRowProps } from './CourseListRow';

// Discussion times are relative to real "now" because the rows read the live clock; rounded to the hour so screenshots are stable.
const HOUR = 60 * 60;
const nowSec = Math.floor(Date.now() / 1000 / HOUR) * HOUR;
const DAY = 24 * HOUR;

const ALICE = 'mp-alice';
const BOB = 'mp-bob';

const UNIT_TITLES = ['Introduction', 'Detecting danger', 'Governance levers', 'Alignment', 'Evaluations', 'Your next steps'];
const UNIT_OFFSETS_SECONDS = [-3 * DAY, -2 * DAY, -DAY, 2 * HOUR, DAY + 2 * HOUR, 2 * DAY + 2 * HOUR];

const course = { slug: 'technical-ai-safety', title: 'Technical AI Safety', applyUrl: null };

const makeGroup = (id: string, groupNumber: number, facilitator: string) => createMockGroup({
  id,
  groupNumber,
  groupName: `Group ${groupNumber}`,
  facilitator: [facilitator],
  round: 'round-1',
  startTimeUtc: nowSec + 2 * HOUR,
  discussionDoc: 'https://example.com/discussion-doc',
  slackChannelId: 'C01ABCDEF',
});

/** Six discussions for a group; `facilitatorByUnit` overrides who runs a given unit (1-based). */
const makeDiscussions = (groupId: string, groupFacilitator: string, facilitatorByUnit: Record<number, string> = {}) => (
  UNIT_OFFSETS_SECONDS.map((offset, i) => createMockGroupDiscussion({
    id: `${groupId}-unit-${i + 1}`,
    group: groupId,
    unitNumber: i + 1,
    courseBuilderUnitRecordId: `unit-${i + 1}`,
    startDateTime: nowSec + offset,
    endDateTime: nowSec + offset + HOUR,
    facilitators: [facilitatorByUnit[i + 1] ?? groupFacilitator],
    participantsExpected: ['p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6'],
    zoomLink: 'https://zoom.us/j/000',
  }))
);

const unitsFor = (discussions: ReturnType<typeof makeDiscussions>) => Object.fromEntries(discussions.map((d) => [d.id, createMockUnit({ unitNumber: `${d.unitNumber}`, title: UNIT_TITLES[(d.unitNumber ?? 1) - 1] })]));

const makeRow = ({ viewer, group, discussions, registrationId }: {
  viewer: string; group: ReturnType<typeof makeGroup>; discussions: ReturnType<typeof makeDiscussions>; registrationId: string;
}): FacilitatorRowProps => ({
  mode: 'facilitator',
  course,
  courseRegistration: {
    id: registrationId,
    courseId: 'course-1',
    email: 'facilitator@example.com',
    decision: 'Accept',
    certificateId: null,
    certificateCreatedAt: null,
    roundId: 'round-1',
    roundName: 'Technical AI Safety (2026 Oct W18) - Intensive',
    roundStatus: 'Active',
    availabilityIntervalsUTC: null,
  },
  group,
  meetPersonId: viewer,
  roundId: 'round-1',
  discussions,
  attendedDiscussionIds: discussions.filter((d) => d.endDateTime < nowSec && d.facilitators.includes(viewer)).map((d) => d.id),
  units: unitsFor(discussions),
  roundStartDate: '2026-10-10',
  roundEndDate: '2026-10-16',
  roundIntensity: 'Intensive',
  hasSubmittedFeedback: false,
  isDroppedOut: false,
  isDeferred: false,
  isDeferredToAnotherRound: false,
  facilitatorNamesByMeetPersonId: { [ALICE]: 'Alice Archer', [BOB]: 'Bob Baker' },
});

const group1 = makeGroup('group-1', 1, ALICE);
// Bob covers Unit 5 of Alice's Group 1.
const group1Discussions = makeDiscussions('group-1', ALICE, { 5: BOB });

const nextDiscussionFor = (row: FacilitatorRowProps) => {
  const discussion = row.discussions.find((d) => d.endDateTime > nowSec && d.facilitators.includes(row.meetPersonId ?? ''))!;
  return {
    courseSlug: course.slug,
    courseTitle: course.title,
    discussion,
    unit: row.units[discussion.id] ?? null,
    group: row.group!,
    facilitatorSubtitle: `Week 18 Intensive Group ${row.group?.groupNumber}`,
  };
};

const aliceCourses = [
  makeRow({
    viewer: ALICE, group: group1, discussions: group1Discussions, registrationId: 'reg-alice',
  }),
];
const bobCourses = [
  makeRow({
    viewer: BOB, group: group1, discussions: group1Discussions.filter((d) => d.facilitators.includes(BOB)), registrationId: 'reg-bob',
  }),
];

const pageHandlers = (courses: FacilitatorRowProps[]) => [
  trpcStorybookMsw.myBluedot.facilitatedCoursesPage.query(() => ({
    courses,
    nextDiscussions: courses.map(nextDiscussionFor).sort((a, b) => a.discussion.startDateTime - b.discussion.startDateTime),
  })),
  trpcStorybookMsw.myBluedot.hasFacilitatorNavItems.query(() => ({ hasFacilitatedCourses: true, hasFacilitatorApplications: false })),
  trpcStorybookMsw.facilitatorApplications.eligibleRounds.query(() => []),
];

const meta = {
  title: 'website/my-courses/FacilitatedCoursesPage',
  component: FacilitatedCoursesPage,
  parameters: {
    layout: 'fullscreen',
    nextjs: { router: { pathname: '/facilitated-courses', query: {} } },
  },
} satisfies Meta<typeof FacilitatedCoursesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Alice runs Group 1; Bob covers Unit 5 for her, so it shows greyed out with no status pill. */
export const GroupFacilitatorWithCoveredDiscussion: Story = {
  parameters: { msw: { handlers: pageHandlers(aliceCourses) } },
};

/** Bob has no group of his own and covers Unit 5 of Alice's Group 1, so that is the only discussion he sees. */
export const SubstituteCoveringOneDiscussion: Story = {
  parameters: { msw: { handlers: pageHandlers(bobCourses) } },
};

