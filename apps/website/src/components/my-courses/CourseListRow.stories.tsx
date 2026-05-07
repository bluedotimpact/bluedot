import type { Meta, StoryObj } from '@storybook/react';
import CourseListRow, { type CourseListRowProps } from './CourseListRow';

const stub = (overrides: Partial<CourseListRowProps> = {}): CourseListRowProps => ({
  course: { slug: 'technical-ai-safety', title: 'Technical AI Safety' } as CourseListRowProps['course'],
  courseRegistration: {
    id: 'reg-1',
    roundStatus: 'Active',
    decision: 'Accept',
    dropoutId: null,
    deferredId: null,
    certificateCreatedAt: null,
    certificateId: null,
    roundId: 'round-1',
  } as CourseListRowProps['courseRegistration'],
  group: { startTimeUtc: 1745784000, slackChannelId: null, discussionDoc: null },
  facilitatorNames: ['Shivam Arora'],
  meetPersonId: 'mp-1',
  roundId: 'round-1',
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
  isExpanded: false,
  onToggleExpand: () => {},
  ...overrides,
});

const meta = {
  title: 'website/my-courses/CourseListRow',
  component: CourseListRow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof CourseListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {
  args: stub(),
};

export const Upcoming: Story = {
  args: stub({
    course: { slug: 'ai-governance', title: 'AI Governance' } as CourseListRowProps['course'],
    courseRegistration: { ...stub().courseRegistration, roundStatus: 'Future' } as CourseListRowProps['courseRegistration'],
  }),
};

export const CompletedWithCertificate: Story = {
  args: stub({
    course: { slug: 'agi-strategy', title: 'AGI Strategy' } as CourseListRowProps['course'],
    courseRegistration: {
      ...stub().courseRegistration,
      roundStatus: 'Past',
      certificateCreatedAt: 1740000000,
      certificateId: 'cert-1',
    } as CourseListRowProps['courseRegistration'],
  }),
};

export const CompletedWithoutCertificate: Story = {
  args: stub({
    course: { slug: 'future-of-ai', title: 'Future of AI' } as CourseListRowProps['course'],
    courseRegistration: { ...stub().courseRegistration, roundStatus: 'Past' } as CourseListRowProps['courseRegistration'],
  }),
};

export const Dropped: Story = {
  args: stub({
    course: { slug: 'biosecurity', title: 'Biosecurity' } as CourseListRowProps['course'],
    courseRegistration: { ...stub().courseRegistration, dropoutId: ['drop_1'] } as CourseListRowProps['courseRegistration'],
  }),
};
