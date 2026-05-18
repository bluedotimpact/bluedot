import type { Meta, StoryObj } from '@storybook/react';
import CourseListRow, { type CourseListRowProps, type FacilitatorRowProps, type ParticipantRowProps } from './CourseListRow';

// Pinned "now" so date-relative content (next discussion, time states) is deterministic.
const NOW_SEC = Math.floor(new Date('2026-05-06T09:00:00Z').getTime() / 1000);
const wednesday4pm = NOW_SEC - (NOW_SEC % (7 * 24 * 60 * 60)) + (3 * 24 * 60 * 60) + (16 * 60 * 60); // a Wednesday at 16:00 UTC

const stubProps = (overrides: Partial<ParticipantRowProps> = {}): ParticipantRowProps => ({
  mode: 'participant',
  course: { slug: 'technical-ai-safety', title: 'Technical AI Safety' } as ParticipantRowProps['course'],
  courseRegistration: {
    id: 'reg-default',
    roundStatus: 'Active',
    decision: 'Accept',
    certificateCreatedAt: null,
    certificateId: null,
    roundId: 'round-default',
  } as ParticipantRowProps['courseRegistration'],
  group: { startTimeUtc: wednesday4pm, slackChannelId: null, discussionDoc: null } as ParticipantRowProps['group'],
  facilitatorNames: ['Test Facilitator'],
  meetPersonId: 'mp-default',
  groupsAsParticipant: ['group-default'],
  roundId: 'round-default',
  discussions: [],
  attendedDiscussionIds: [],
  units: {},
  roundStartDate: null,
  roundEndDate: null,
  numUnits: null,
  uniqueDiscussionAttendance: null,
  hasSubmittedActionPlan: false,
  feedbackFormUrl: null,
  hasSubmittedFeedback: false,
  rescheduleEligibleUnits: [],
  isDroppedOut: false,
  isDeferred: false,
  isExpanded: false,
  onToggleExpand: () => {},
  ...overrides,
});

const stubFacilitator = (overrides: Partial<FacilitatorRowProps> = {}): FacilitatorRowProps => ({
  mode: 'facilitator',
  course: { slug: 'technical-ai-safety', title: 'Technical AI Safety', applyUrl: null },
  courseRegistration: {
    id: 'reg-fac-default',
    roundStatus: 'Active',
    decision: 'Accept',
    roundId: 'round-fac-default',
    roundName: 'Technical AI Safety (2026 Mar W18) - Intensive',
  } as FacilitatorRowProps['courseRegistration'],
  group: null,
  meetPersonId: 'mp-fac-default',
  roundId: 'round-fac-default',
  discussions: [],
  attendedDiscussionIds: [],
  units: {},
  roundStartDate: '2026-03-10',
  roundEndDate: '2026-03-17',
  roundIntensity: 'Intensive',
  hasSubmittedFeedback: false,
  isDroppedOut: false,
  isDeferred: false,
  isExpanded: false,
  onToggleExpand: () => {},
  ...overrides,
});

// In-progress (Active, accepted, in a group)
const inProgressArgs = stubProps({
  courseRegistration: { ...stubProps().courseRegistration, id: 'reg-in-progress', roundStatus: 'Active' } as CourseListRowProps['courseRegistration'],
  course: { slug: 'technical-ai-safety', title: 'Technical AI Safety', applyUrl: null },
  group: { startTimeUtc: wednesday4pm, slackChannelId: 'C01ABCDEF', discussionDoc: 'https://example.com/discussion-doc' } as CourseListRowProps['group'],
});

// Upcoming (Future) + Accept
const upcomingAcceptedArgs = stubProps({
  courseRegistration: {
    ...stubProps().courseRegistration, id: 'reg-upcoming-accept', roundStatus: 'Future', decision: 'Accept',
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'ai-governance', title: 'AI Governance' } as CourseListRowProps['course'],
  roundStartDate: '2026-06-15',
});

// Upcoming + null decision (Application in review)
const upcomingInReviewArgs = stubProps({
  courseRegistration: {
    ...stubProps().courseRegistration, id: 'reg-upcoming-review', roundStatus: 'Future', decision: null,
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'biosecurity', title: 'Biosecurity' } as CourseListRowProps['course'],
  roundStartDate: '2026-06-15',
});

// Upcoming + Reject
const upcomingRejectedArgs = stubProps({
  courseRegistration: {
    ...stubProps().courseRegistration, id: 'reg-upcoming-reject', roundStatus: 'Future', decision: 'Reject',
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'agi-strategy', title: 'AGI Strategy' } as CourseListRowProps['course'],
  roundStartDate: '2026-06-15',
});

// Accepted to an Active round but not yet placed in a group
const notYetInGroupArgs = stubProps({
  courseRegistration: { ...stubProps().courseRegistration, id: 'reg-not-in-group', roundStatus: 'Active' } as CourseListRowProps['courseRegistration'],
  course: { slug: 'biosecurity', title: 'Biosecurity' } as CourseListRowProps['course'],
  group: null,
  groupsAsParticipant: [],
  facilitatorNames: [],
  roundStartDate: '2026-05-15',
});

// Past + cert (same month) + feedback submitted
const completedWithCertArgs = stubProps({
  courseRegistration: {
    ...stubProps().courseRegistration,
    id: 'reg-completed-cert',
    roundStatus: 'Past',
    certificateCreatedAt: new Date('2026-03-18T00:00:00Z').getTime() / 1000,
    certificateId: 'cert-completed',
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'agi-strategy', title: 'AGI Strategy' } as CourseListRowProps['course'],
  roundStartDate: '2026-03-10',
  roundEndDate: '2026-03-17',
  feedbackFormUrl: 'https://example.com/feedback',
  hasSubmittedFeedback: true,
});

// Past + cert + feedback NOT submitted
const completedWithCertLockedArgs = stubProps({
  courseRegistration: {
    ...stubProps().courseRegistration,
    id: 'reg-completed-locked',
    roundStatus: 'Past',
    certificateCreatedAt: new Date('2026-04-20T00:00:00Z').getTime() / 1000,
    certificateId: 'cert-locked',
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'technical-ai-safety', title: 'Technical AI Safety' } as CourseListRowProps['course'],
  roundStartDate: '2026-03-10',
  roundEndDate: '2026-04-17',
  feedbackFormUrl: 'https://example.com/feedback',
  hasSubmittedFeedback: false,
});

// Past + cert + cross-year date range. Sanity check for the date formatter.
const completedWithCertCrossYearArgs = stubProps({
  courseRegistration: {
    ...stubProps().courseRegistration,
    id: 'reg-completed-cross-year',
    roundStatus: 'Past',
    certificateCreatedAt: new Date('2026-01-10T00:00:00Z').getTime() / 1000,
    certificateId: 'cert-cross-year',
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'ai-governance', title: 'AI Governance' } as CourseListRowProps['course'],
  roundStartDate: '2025-12-28',
  roundEndDate: '2026-01-05',
  feedbackFormUrl: 'https://example.com/feedback',
  hasSubmittedFeedback: true,
});

// Past + no cert + no action plan yet
const completedNoCertEligibleArgs = stubProps({
  courseRegistration: {
    ...stubProps().courseRegistration, id: 'reg-completed-no-cert-eligible', roundStatus: 'Past', certificateCreatedAt: null,
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'technical-ai-safety', title: 'Technical AI Safety' } as CourseListRowProps['course'],
  roundStartDate: '2026-03-10',
  roundEndDate: '2026-04-17',
  numUnits: 8,
  uniqueDiscussionAttendance: 7,
  hasSubmittedActionPlan: false,
});

// Past + no cert + action plan submitted but missed too many
const completedNoCertActionPlanSubmittedArgs = stubProps({
  courseRegistration: {
    ...stubProps().courseRegistration, id: 'reg-completed-no-cert-submitted', roundStatus: 'Past', certificateCreatedAt: null,
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'biosecurity', title: 'Biosecurity' } as CourseListRowProps['course'],
  roundStartDate: '2026-03-10',
  roundEndDate: '2026-03-17',
  numUnits: 8,
  uniqueDiscussionAttendance: 5,
  hasSubmittedActionPlan: true,
});

// Past + no cert + FOAI (non-facilitated, self-paced)
const completedNoCertFoaiArgs = stubProps({
  courseRegistration: {
    ...stubProps().courseRegistration, id: 'reg-completed-foai', roundStatus: 'Past', certificateCreatedAt: null,
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'future-of-ai', title: 'Future of AI' } as CourseListRowProps['course'],
  numUnits: 0,
  uniqueDiscussionAttendance: 0,
});

// Dropped + had attended some discussions before dropping
const droppedArgs = stubProps({
  courseRegistration: {
    ...stubProps().courseRegistration, id: 'reg-dropped', roundStatus: 'Active',
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'biosecurity', title: 'Biosecurity' } as CourseListRowProps['course'],
  isDroppedOut: true,
  roundStartDate: '2026-03-10',
  roundEndDate: '2026-04-17',
  attendedDiscussionIds: ['disc-1', 'disc-2'],
});

// Dropped + no prior attendance
const droppedNoAttendanceArgs = stubProps({
  courseRegistration: {
    ...stubProps().courseRegistration, id: 'reg-dropped-no-attendance', roundStatus: 'Active',
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'biosecurity', title: 'Biosecurity' } as CourseListRowProps['course'],
  isDroppedOut: true,
  roundStartDate: '2026-03-10',
  roundEndDate: '2026-04-17',
  attendedDiscussionIds: [],
});

const wednesday2pmIntensive = NOW_SEC - (NOW_SEC % (7 * 24 * 60 * 60)) + (3 * 24 * 60 * 60) + (14 * 60 * 60);
const monday2pmPartTime = NOW_SEC - (NOW_SEC % (7 * 24 * 60 * 60)) + (1 * 24 * 60 * 60) + (14 * 60 * 60);

const facilitatorInProgressIntensiveArgs = stubFacilitator({
  courseRegistration: {
    id: 'reg-fac-intensive',
    roundStatus: 'Active',
    decision: 'Accept',
    roundId: 'round-fac-intensive',
    roundName: 'Technical AI Safety (2026 Mar W18) - Intensive',
  } as FacilitatorRowProps['courseRegistration'],
  course: { slug: 'technical-ai-safety', title: 'Technical AI Safety', applyUrl: null },
  group: {
    id: 'group-7', groupNumber: 7, groupName: 'Group 7', startTimeUtc: wednesday2pmIntensive, slackChannelId: 'C01ABCDEF', discussionDoc: 'https://example.com/discussion-doc',
  } as FacilitatorRowProps['group'],
  roundStartDate: '2026-03-10',
  roundEndDate: '2026-03-17',
  roundIntensity: 'Intensive',
  meetPersonId: 'mp-fac-1',
});

const facilitatorInProgressPartTimeArgs = stubFacilitator({
  courseRegistration: {
    id: 'reg-fac-parttime',
    roundStatus: 'Active',
    decision: 'Accept',
    roundId: 'round-fac-parttime',
    roundName: 'AGI Strategy (2026 Mar W18) - Part-time',
  } as FacilitatorRowProps['courseRegistration'],
  course: { slug: 'agi-strategy', title: 'AGI Strategy', applyUrl: null },
  group: {
    id: 'group-10', groupNumber: 10, groupName: 'Group 10', startTimeUtc: monday2pmPartTime, slackChannelId: 'C01XYZ', discussionDoc: 'https://example.com/discussion-doc',
  } as FacilitatorRowProps['group'],
  roundStartDate: '2026-03-10',
  roundEndDate: '2026-04-14',
  roundIntensity: 'Part-time',
  meetPersonId: 'mp-fac-2',
});

const facilitatorUpcomingArgs = stubFacilitator({
  courseRegistration: {
    id: 'reg-fac-upcoming',
    roundStatus: 'Future',
    decision: 'Accept',
    roundId: 'round-fac-upcoming',
    roundName: 'Technical AI Safety (2026 May W19) - Intensive',
  } as FacilitatorRowProps['courseRegistration'],
  course: { slug: 'technical-ai-safety', title: 'Technical AI Safety', applyUrl: null },
  group: {
    id: 'group-9', groupNumber: 9, groupName: 'Group 9', startTimeUtc: wednesday2pmIntensive, slackChannelId: 'C01ABC', discussionDoc: 'https://example.com/doc',
  } as FacilitatorRowProps['group'],
  roundStartDate: '2026-05-04',
  roundEndDate: '2026-05-11',
  roundIntensity: 'Intensive',
  meetPersonId: 'mp-fac-3',
});

const facilitatorPendingArgs = stubFacilitator({
  courseRegistration: {
    id: 'reg-fac-pending',
    roundStatus: 'Future',
    decision: 'Accept',
    roundId: 'round-fac-pending',
    roundName: 'Technical AI Safety (2026 May W20) - Intensive',
  } as FacilitatorRowProps['courseRegistration'],
  course: { slug: 'technical-ai-safety', title: 'Technical AI Safety', applyUrl: null },
  group: null,
  roundStartDate: '2026-05-11',
  roundEndDate: '2026-05-18',
  roundIntensity: 'Intensive',
  meetPersonId: 'mp-fac-pending',
});

const facilitatorPastNeedFeedbackArgs = stubFacilitator({
  courseRegistration: {
    id: 'reg-fac-past-need',
    roundStatus: 'Past',
    decision: 'Accept',
    roundId: 'round-fac-past',
    roundName: 'AGI Strategy (2026 Feb W08) - Part-time',
  } as FacilitatorRowProps['courseRegistration'],
  course: { slug: 'agi-strategy', title: 'AGI Strategy', applyUrl: null },
  group: {
    id: 'group-3', groupNumber: 3, groupName: 'Group 3', startTimeUtc: monday2pmPartTime, slackChannelId: 'C0123', discussionDoc: 'https://example.com/doc',
  } as FacilitatorRowProps['group'],
  roundStartDate: '2026-02-23',
  roundEndDate: '2026-03-23',
  roundIntensity: 'Part-time',
  meetPersonId: 'mp-fac-past-1',
  hasSubmittedFeedback: false,
});

const facilitatorPastFeedbackSubmittedArgs: FacilitatorRowProps = {
  ...facilitatorPastNeedFeedbackArgs,
  courseRegistration: {
    ...facilitatorPastNeedFeedbackArgs.courseRegistration,
    id: 'reg-fac-past-submitted',
  },
  meetPersonId: 'mp-fac-past-2',
  hasSubmittedFeedback: true,
};

const meta = {
  title: 'website/my-courses/CourseListRow',
  component: CourseListRow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof CourseListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const ALL = [
  { id: 'in-progress', args: inProgressArgs },
  { id: 'upcoming-accept', args: upcomingAcceptedArgs },
  { id: 'upcoming-in-review', args: upcomingInReviewArgs },
  { id: 'upcoming-reject', args: upcomingRejectedArgs },
  { id: 'not-yet-in-group', args: notYetInGroupArgs },
  { id: 'completed-with-cert', args: completedWithCertArgs },
  { id: 'completed-with-cert-locked', args: completedWithCertLockedArgs },
  { id: 'completed-with-cert-cross-year', args: completedWithCertCrossYearArgs },
  { id: 'completed-no-cert-eligible', args: completedNoCertEligibleArgs },
  { id: 'completed-no-cert-action-plan-submitted', args: completedNoCertActionPlanSubmittedArgs },
  { id: 'completed-no-cert-foai', args: completedNoCertFoaiArgs },
  { id: 'dropped', args: droppedArgs },
  { id: 'dropped-no-attendance', args: droppedNoAttendanceArgs },
];

const ALL_FACILITATOR = [
  { id: 'fac-in-progress-intensive', args: facilitatorInProgressIntensiveArgs },
  { id: 'fac-in-progress-parttime', args: facilitatorInProgressPartTimeArgs },
  { id: 'fac-upcoming', args: facilitatorUpcomingArgs },
  { id: 'fac-pending', args: facilitatorPendingArgs },
  { id: 'fac-past-need-feedback', args: facilitatorPastNeedFeedbackArgs },
  { id: 'fac-past-feedback-submitted', args: facilitatorPastFeedbackSubmittedArgs },
];

// Convenience story to be able to skim through all states with no visual clutter
export const AllStates: Story = {
  args: inProgressArgs,
  render: () => (
    <div className="flex flex-col gap-6">
      {ALL.map((row) => <CourseListRow key={row.id} {...row.args} />)}
    </div>
  ),
};

export const AllFacilitatorStates: Story = {
  args: facilitatorInProgressIntensiveArgs,
  render: () => (
    <div className="flex flex-col gap-6">
      {ALL_FACILITATOR.map((row) => <CourseListRow key={row.id} {...row.args} />)}
    </div>
  ),
};

export const InProgress: Story = { args: inProgressArgs };
export const UpcomingAccepted: Story = { args: upcomingAcceptedArgs };
export const UpcomingInReview: Story = { args: upcomingInReviewArgs };
export const UpcomingRejected: Story = { args: upcomingRejectedArgs };
export const NotYetInGroup: Story = { args: notYetInGroupArgs };
export const CompletedWithCertificate: Story = { args: completedWithCertArgs };
export const CompletedWithCertificateLocked: Story = { args: completedWithCertLockedArgs };
export const CompletedWithCertificateCrossYear: Story = { args: completedWithCertCrossYearArgs };
export const CompletedNoCertEligible: Story = { args: completedNoCertEligibleArgs };
export const CompletedNoCertActionPlanSubmitted: Story = { args: completedNoCertActionPlanSubmittedArgs };
export const CompletedNoCertFoai: Story = { args: completedNoCertFoaiArgs };
export const Dropped: Story = { args: droppedArgs };
export const DroppedNoAttendance: Story = { args: droppedNoAttendanceArgs };

export const FacilitatorInProgressIntensive: Story = { args: facilitatorInProgressIntensiveArgs };
export const FacilitatorInProgressPartTime: Story = { args: facilitatorInProgressPartTimeArgs };
export const FacilitatorUpcoming: Story = { args: facilitatorUpcomingArgs };
export const FacilitatorPending: Story = { args: facilitatorPendingArgs };
export const FacilitatorPastNeedFeedback: Story = { args: facilitatorPastNeedFeedbackArgs };
export const FacilitatorPastFeedbackSubmitted: Story = { args: facilitatorPastFeedbackSubmittedArgs };
