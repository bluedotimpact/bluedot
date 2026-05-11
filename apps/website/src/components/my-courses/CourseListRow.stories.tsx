import type { Meta, StoryObj } from '@storybook/react';
import CourseListRow, { type CourseListRowProps } from './CourseListRow';

// Pinned "now" so date-relative content (next discussion, time states) is deterministic.
const NOW_SEC = Math.floor(new Date('2026-05-06T09:00:00Z').getTime() / 1000);
const wednesday4pm = NOW_SEC - (NOW_SEC % (7 * 24 * 60 * 60)) + (3 * 24 * 60 * 60) + (16 * 60 * 60); // a Wednesday at 16:00 UTC

const stub = (overrides: Partial<CourseListRowProps> = {}): CourseListRowProps => ({
  course: { slug: 'technical-ai-safety', title: 'Technical AI Safety' } as CourseListRowProps['course'],
  courseRegistration: {
    id: 'reg-default',
    roundStatus: 'Active',
    decision: 'Accept',
    dropoutId: null,
    deferredId: null,
    certificateCreatedAt: null,
    certificateId: null,
    roundId: 'round-default',
  } as CourseListRowProps['courseRegistration'],
  group: { startTimeUtc: wednesday4pm, slackChannelId: null, discussionDoc: null },
  facilitatorNames: ['Shivam Arora'],
  meetPersonId: 'mp-default',
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
  isExpanded: false,
  onToggleExpand: () => {},
  ...overrides,
});

// In-progress (Active, accepted, in a group). Recurring-schedule subtitle, overflow menu populated.
const inProgressArgs = stub({
  courseRegistration: { ...stub().courseRegistration, id: 'reg-in-progress', roundStatus: 'Active' } as CourseListRowProps['courseRegistration'],
  course: { slug: 'technical-ai-safety', title: 'Technical AI Safety', applyUrl: null },
  group: { startTimeUtc: wednesday4pm, slackChannelId: 'C01ABCDEF', discussionDoc: 'https://example.com/discussion-doc' },
});

// Upcoming (Future) + Accept. Status word + Course starts. Title application-timeline tooltip.
const upcomingAcceptedArgs = stub({
  courseRegistration: {
    ...stub().courseRegistration, id: 'reg-upcoming-accept', roundStatus: 'Future', decision: 'Accept',
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'ai-governance', title: 'AI Governance' } as CourseListRowProps['course'],
  roundStartDate: '2026-06-15',
});

// Upcoming + null decision (Application in review). Title application-timeline tooltip.
const upcomingInReviewArgs = stub({
  courseRegistration: {
    ...stub().courseRegistration, id: 'reg-upcoming-review', roundStatus: 'Future', decision: null,
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'biosecurity', title: 'Biosecurity' } as CourseListRowProps['course'],
  roundStartDate: '2026-06-15',
});

// Upcoming + Reject. No tooltip, no Submit availability button.
const upcomingRejectedArgs = stub({
  courseRegistration: {
    ...stub().courseRegistration, id: 'reg-upcoming-reject', roundStatus: 'Future', decision: 'Reject',
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'agi-strategy', title: 'AGI Strategy' } as CourseListRowProps['course'],
  roundStartDate: '2026-06-15',
});

// Accepted to an Active round but not yet placed in a group. No-group subtitle.
const notYetInGroupArgs = stub({
  courseRegistration: { ...stub().courseRegistration, id: 'reg-not-in-group', roundStatus: 'Active' } as CourseListRowProps['courseRegistration'],
  course: { slug: 'biosecurity', title: 'Biosecurity' } as CourseListRowProps['course'],
  group: null,
  facilitatorNames: [],
  roundStartDate: '2026-05-15',
});

// Past + cert (same month) + feedback submitted → date range subtitle + View certificate CTA.
const completedWithCertArgs = stub({
  courseRegistration: {
    ...stub().courseRegistration,
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

// Past + cert + feedback NOT submitted → Locked cert CTA (Share feedback to view your certificate).
const completedWithCertLockedArgs = stub({
  courseRegistration: {
    ...stub().courseRegistration,
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
const completedWithCertCrossYearArgs = stub({
  courseRegistration: {
    ...stub().courseRegistration,
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

// Past + no cert + no action plan yet → attendance line in subtitle, cert-eligibility tooltip, Submit action plan CTA.
const completedNoCertEligibleArgs = stub({
  courseRegistration: {
    ...stub().courseRegistration, id: 'reg-completed-no-cert-eligible', roundStatus: 'Past', certificateCreatedAt: null,
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'technical-ai-safety', title: 'Technical AI Safety' } as CourseListRowProps['course'],
  roundStartDate: '2026-03-10',
  roundEndDate: '2026-04-17',
  numUnits: 8,
  uniqueDiscussionAttendance: 7,
  hasSubmittedActionPlan: false,
});

// Past + no cert + action plan submitted but missed too many → Action plan submitted (disabled with check).
const completedNoCertActionPlanSubmittedArgs = stub({
  courseRegistration: {
    ...stub().courseRegistration, id: 'reg-completed-no-cert-submitted', roundStatus: 'Past', certificateCreatedAt: null,
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'biosecurity', title: 'Biosecurity' } as CourseListRowProps['course'],
  roundStartDate: '2026-03-10',
  roundEndDate: '2026-03-17',
  numUnits: 8,
  uniqueDiscussionAttendance: 5,
  hasSubmittedActionPlan: true,
});

// Past + no cert + FOAI (non-facilitated, self-paced). numUnits=0 suppresses the attendance line.
// No cert-eligibility tooltip, no action-plan CTA.
const completedNoCertFoaiArgs = stub({
  courseRegistration: {
    ...stub().courseRegistration, id: 'reg-completed-foai', roundStatus: 'Past', certificateCreatedAt: null,
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'future-of-ai', title: 'Future of AI' } as CourseListRowProps['course'],
  numUnits: 0,
  uniqueDiscussionAttendance: 0,
});

// Dropped + had attended some discussions before dropping. Date-range subtitle, Dropped pill,
// Apply again, and chevron (canExpand allows when attendedDiscussionIds is non-empty).
const droppedArgs = stub({
  courseRegistration: {
    ...stub().courseRegistration, id: 'reg-dropped', roundStatus: 'Active', dropoutId: ['dropout-1'], deferredId: null,
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'biosecurity', title: 'Biosecurity' } as CourseListRowProps['course'],
  roundStartDate: '2026-03-10',
  roundEndDate: '2026-04-17',
  attendedDiscussionIds: ['disc-1', 'disc-2'],
});

// Dropped + no prior attendance. Same row content but no chevron (canExpand is false).
const droppedNoAttendanceArgs = stub({
  courseRegistration: {
    ...stub().courseRegistration, id: 'reg-dropped-no-attendance', roundStatus: 'Active', dropoutId: ['dropout-2'], deferredId: null,
  } as CourseListRowProps['courseRegistration'],
  course: { slug: 'biosecurity', title: 'Biosecurity' } as CourseListRowProps['course'],
  roundStartDate: '2026-03-10',
  roundEndDate: '2026-04-17',
  attendedDiscussionIds: [],
});

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

// Designer scroll-through: every meaningful state stacked vertically. First so it shows top of
// the sidebar in Storybook.
export const AllStates: Story = {
  args: inProgressArgs,
  render: () => (
    <div className="flex flex-col gap-6">
      {ALL.map((row) => <CourseListRow key={row.id} {...row.args} />)}
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
