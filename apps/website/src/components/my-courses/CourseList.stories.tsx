import type { Meta, StoryObj } from '@storybook/react';
import CourseList from './CourseList';
import type { CourseListRowProps } from './CourseListRow';

// Pinned "now" so date-relative content (next discussion, time states) is deterministic.
// All discussion timestamps below are relative to this.
const NOW_SEC = Math.floor(new Date('2026-05-06T09:00:00Z').getTime() / 1000);

const wednesday4pm = NOW_SEC - (NOW_SEC % (7 * 24 * 60 * 60)) + (3 * 24 * 60 * 60) + (16 * 60 * 60); // a Wednesday at 16:00 UTC

const stub = (overrides: Partial<CourseListRowProps>): CourseListRowProps => ({
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

const COURSES: CourseListRowProps[] = [
  // 1. Normal Active. Recurring-schedule subtitle, overflow menu populated.
  stub({
    courseRegistration: {
      ...stub({}).courseRegistration,
      id: 'reg-1',
      roundStatus: 'Active',
    } as CourseListRowProps['courseRegistration'],
    course: { slug: 'technical-ai-safety', title: 'Technical AI Safety' },
    group: { startTimeUtc: wednesday4pm, slackChannelId: 'C01ABCDEF', discussionDoc: 'https://example.com/discussion-doc' },
  }),

  // 2. Future + Accept. Status word + Course starts. Title timeline tooltip.
  stub({
    courseRegistration: {
      ...stub({}).courseRegistration,
      id: 'reg-2',
      roundStatus: 'Future',
      decision: 'Accept',
    } as CourseListRowProps['courseRegistration'],
    course: { slug: 'ai-governance', title: 'AI Governance' } as CourseListRowProps['course'],
    roundStartDate: '2026-06-15',
  }),

  // 3. Future + null decision (Application in review). Title timeline tooltip.
  stub({
    courseRegistration: {
      ...stub({}).courseRegistration,
      id: 'reg-3',
      roundStatus: 'Future',
      decision: null,
    } as CourseListRowProps['courseRegistration'],
    course: { slug: 'biosecurity', title: 'Biosecurity' } as CourseListRowProps['course'],
    roundStartDate: '2026-06-15',
  }),

  // 4. Future + Reject. No timeline tooltip.
  stub({
    courseRegistration: {
      ...stub({}).courseRegistration,
      id: 'reg-4',
      roundStatus: 'Future',
      decision: 'Reject',
    } as CourseListRowProps['courseRegistration'],
    course: { slug: 'agi-strategy', title: 'AGI Strategy' } as CourseListRowProps['course'],
    roundStartDate: '2026-06-15',
  }),

  // 5. isNotInGroup (Active, accepted, not yet placed). No-group subtitle + " · Course starts X" on desktop.
  stub({
    courseRegistration: {
      ...stub({}).courseRegistration,
      id: 'reg-5',
      roundStatus: 'Active',
    } as CourseListRowProps['courseRegistration'],
    course: { slug: 'biosecurity', title: 'Biosecurity' } as CourseListRowProps['course'],
    group: null,
    facilitatorNames: [],
    roundStartDate: '2026-05-15',
  }),

  // 6. Past + cert (same-month) + feedback submitted → date range + View certificate.
  stub({
    courseRegistration: {
      ...stub({}).courseRegistration,
      id: 'reg-6',
      roundStatus: 'Past',
      certificateCreatedAt: new Date('2026-03-18T00:00:00Z').getTime() / 1000,
      certificateId: 'cert-6',
    } as CourseListRowProps['courseRegistration'],
    course: { slug: 'agi-strategy', title: 'AGI Strategy' } as CourseListRowProps['course'],
    roundStartDate: '2026-03-10',
    roundEndDate: '2026-03-17',
    feedbackFormUrl: 'https://example.com/feedback',
    hasSubmittedFeedback: true,
  }),

  // 7. Past + cert (cross-month) + feedback NOT submitted → date range + Locked cert CTA.
  stub({
    courseRegistration: {
      ...stub({}).courseRegistration,
      id: 'reg-7',
      roundStatus: 'Past',
      certificateCreatedAt: new Date('2026-04-20T00:00:00Z').getTime() / 1000,
      certificateId: 'cert-7',
    } as CourseListRowProps['courseRegistration'],
    course: { slug: 'technical-ai-safety', title: 'Technical AI Safety' } as CourseListRowProps['course'],
    roundStartDate: '2026-03-10',
    roundEndDate: '2026-04-17',
    feedbackFormUrl: 'https://example.com/feedback',
    hasSubmittedFeedback: false,
  }),

  // 8. Past + cert (cross-year) + feedback submitted → date range + View certificate.
  stub({
    courseRegistration: {
      ...stub({}).courseRegistration,
      id: 'reg-8',
      roundStatus: 'Past',
      certificateCreatedAt: new Date('2026-01-10T00:00:00Z').getTime() / 1000,
      certificateId: 'cert-8',
    } as CourseListRowProps['courseRegistration'],
    course: { slug: 'ai-governance', title: 'AI Governance' } as CourseListRowProps['course'],
    roundStartDate: '2025-12-28',
    roundEndDate: '2026-01-05',
    feedbackFormUrl: 'https://example.com/feedback',
    hasSubmittedFeedback: true,
  }),

  // 9. Past + no cert + ineligible (no action plan). Date range + attendance subtitle + cert eligibility tooltip + Submit action plan CTA.
  stub({
    courseRegistration: {
      ...stub({}).courseRegistration,
      id: 'reg-9',
      roundStatus: 'Past',
      certificateCreatedAt: null,
    } as CourseListRowProps['courseRegistration'],
    course: { slug: 'technical-ai-safety', title: 'Technical AI Safety' } as CourseListRowProps['course'],
    roundStartDate: '2026-03-10',
    roundEndDate: '2026-04-17',
    numUnits: 8,
    uniqueDiscussionAttendance: 7,
    hasSubmittedActionPlan: false,
  }),

  // 10. Past + no cert + action plan submitted but missed too many. Date range + attendance + tooltip + Action plan submitted ✓.
  stub({
    courseRegistration: {
      ...stub({}).courseRegistration,
      id: 'reg-10',
      roundStatus: 'Past',
      certificateCreatedAt: null,
    } as CourseListRowProps['courseRegistration'],
    course: { slug: 'biosecurity', title: 'Biosecurity' } as CourseListRowProps['course'],
    roundStartDate: '2026-03-10',
    roundEndDate: '2026-03-17',
    numUnits: 8,
    uniqueDiscussionAttendance: 5,
    hasSubmittedActionPlan: true,
  }),

  // 11. Past + no cert + FOAI (non-facilitated, self-paced). No round dates, no discussions
  //     (numUnits=0 suppresses the attendance line). No eligibility tooltip, no action-plan CTA.
  stub({
    courseRegistration: {
      ...stub({}).courseRegistration,
      id: 'reg-11',
      roundStatus: 'Past',
      certificateCreatedAt: null,
    } as CourseListRowProps['courseRegistration'],
    course: { slug: 'future-of-ai', title: 'Future of AI' } as CourseListRowProps['course'],
    numUnits: 0,
    uniqueDiscussionAttendance: 0,
  }),

  // 12. Dropped + attended some sessions before dropping. Date-range subtitle, Dropped pill,
  //     Apply again, and chevron (because canExpand uses attendedDiscussionIds.length > 0).
  stub({
    courseRegistration: {
      ...stub({}).courseRegistration,
      id: 'reg-12',
      roundStatus: 'Active',
      dropoutId: ['dropout-1'],
      deferredId: null,
    } as CourseListRowProps['courseRegistration'],
    course: { slug: 'biosecurity', title: 'Biosecurity' } as CourseListRowProps['course'],
    roundStartDate: '2026-03-10',
    roundEndDate: '2026-04-17',
    attendedDiscussionIds: ['disc-1', 'disc-2'],
  }),
];

const MOBILE_VIEWPORT = {
  name: 'Mobile (450px)',
  styles: { width: '450px', height: '844px' },
  type: 'mobile' as const,
};

const meta = {
  title: 'website/my-courses/CourseList',
  component: CourseList,
  parameters: {
    layout: 'padded',
    viewport: {
      viewports: { mobile: MOBILE_VIEWPORT },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CourseList>;

export default meta;
type Story = StoryObj<typeof meta>;

// Every subtitle / CTA / pill / tooltip state in one stack. Each row is annotated above its
// definition in the source so you can map back to the case.
export const AllStatesDesktop: Story = {
  args: { courses: COURSES },
};

// Same content at a fixed 390px viewport so mobile responsive styles take effect.
export const AllStatesMobile: Story = {
  args: { courses: COURSES },
  parameters: {
    viewport: { defaultViewport: 'mobile' },
  },
};

export const Empty: Story = {
  args: { courses: [], emptyMessage: 'No courses to show.' },
};
