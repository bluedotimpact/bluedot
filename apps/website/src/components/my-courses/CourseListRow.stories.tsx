import type { Course, CourseRegistration, Group } from '@bluedot/db';
import type { Meta, StoryObj } from '@storybook/react';
import CourseListRow from './CourseListRow';

const STUB_GROUP = { startTimeUtc: 1745784000 } as unknown as Group;
const stubReg = (overrides: Partial<CourseRegistration> = {}): CourseRegistration => ({
  roundStatus: 'Active',
  decision: 'Accept',
  dropoutId: null,
  deferredId: null,
  certificateCreatedAt: null,
  ...overrides,
} as unknown as CourseRegistration);
const stubCourse = (slug: string, title: string): Course => ({ slug, title } as unknown as Course);

const meta = {
  title: 'website/my-courses/CourseListRow',
  component: CourseListRow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    group: STUB_GROUP,
    facilitatorNames: ['Shivam Arora'],
  },
} satisfies Meta<typeof CourseListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {
  args: {
    course: stubCourse('technical-ai-safety', 'Technical AI Safety'),
    courseRegistration: stubReg({ roundStatus: 'Active' }),
  },
};

export const Upcoming: Story = {
  args: {
    course: stubCourse('ai-governance', 'AI Governance'),
    courseRegistration: stubReg({ roundStatus: 'Future' }),
  },
};

export const CompletedWithCertificate: Story = {
  args: {
    course: stubCourse('agi-strategy', 'AGI Strategy'),
    courseRegistration: stubReg({ roundStatus: 'Past', certificateCreatedAt: 1740000000 }),
  },
};

export const CompletedWithoutCertificate: Story = {
  args: {
    course: stubCourse('future-of-ai', 'Future of AI'),
    courseRegistration: stubReg({ roundStatus: 'Past' }),
  },
};

export const Dropped: Story = {
  args: {
    course: stubCourse('biosecurity', 'Biosecurity'),
    courseRegistration: stubReg({ roundStatus: 'Active', dropoutId: ['drop_1'] }),
  },
};
