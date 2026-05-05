import type { Meta, StoryObj } from '@storybook/react';
import CourseListRow from './CourseListRow';
import type { EnrichedCourse } from './CourseList';

const stubCourse = (overrides: Partial<EnrichedCourse> = {}): EnrichedCourse => ({
  course: { slug: 'technical-ai-safety', title: 'Technical AI Safety' } as EnrichedCourse['course'],
  courseRegistration: {
    id: 'reg-1',
    roundStatus: 'Active',
    decision: 'Accept',
    dropoutId: null,
    deferredId: null,
    certificateCreatedAt: null,
    certificateId: null,
    roundId: 'round-1',
  } as EnrichedCourse['courseRegistration'],
  group: { startTimeUtc: 1745784000 } as EnrichedCourse['group'],
  facilitatorNames: ['Shivam Arora'],
  meetPersonId: 'mp-1',
  roundId: 'round-1',
  discussions: [],
  attendedDiscussionIds: [],
  units: {},
  slackChannelId: null,
  activityDoc: null,
  roundStartDate: null,
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
  args: { course: stubCourse() },
};

export const Upcoming: Story = {
  args: {
    course: stubCourse({
      course: { slug: 'ai-governance', title: 'AI Governance' } as EnrichedCourse['course'],
      courseRegistration: { ...stubCourse().courseRegistration, roundStatus: 'Future' } as EnrichedCourse['courseRegistration'],
    }),
  },
};

export const CompletedWithCertificate: Story = {
  args: {
    course: stubCourse({
      course: { slug: 'agi-strategy', title: 'AGI Strategy' } as EnrichedCourse['course'],
      courseRegistration: {
        ...stubCourse().courseRegistration,
        roundStatus: 'Past',
        certificateCreatedAt: 1740000000,
        certificateId: 'cert-1',
      } as EnrichedCourse['courseRegistration'],
    }),
  },
};

export const CompletedWithoutCertificate: Story = {
  args: {
    course: stubCourse({
      course: { slug: 'future-of-ai', title: 'Future of AI' } as EnrichedCourse['course'],
      courseRegistration: { ...stubCourse().courseRegistration, roundStatus: 'Past' } as EnrichedCourse['courseRegistration'],
    }),
  },
};

export const Dropped: Story = {
  args: {
    course: stubCourse({
      course: { slug: 'biosecurity', title: 'Biosecurity' } as EnrichedCourse['course'],
      courseRegistration: { ...stubCourse().courseRegistration, dropoutId: ['drop_1'] } as EnrichedCourse['courseRegistration'],
    }),
  },
};
