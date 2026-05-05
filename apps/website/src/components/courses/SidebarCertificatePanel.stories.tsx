import type { Meta, StoryObj } from '@storybook/react';
import { SidebarCertificatePanel } from './SidebarCertificatePanel';

const meta = {
  title: 'website/courses/SidebarCertificatePanel',
  component: SidebarCertificatePanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    courseTitle: 'AI Strategy',
    courseSlug: 'agi-strategy',
  },
} satisfies Meta<typeof SidebarCertificatePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotEnrolled: Story = {
  args: {
    certificateData: undefined,
  },
};

export const NotEligible: Story = {
  args: {
    certificateData: { status: 'not-eligible' },
  },
};

export const CanRequest: Story = {
  args: {
    certificateData: { status: 'can-request' },
  },
};

export const ActionPlanPending: Story = {
  args: {
    certificateData: {
      status: 'action-plan-pending',
      meetPersonId: 'meet-person-123',
      hasSubmittedActionPlan: false,
      isLastDiscussionSoonOrPassed: true,
    },
  },
};

export const AttendanceIneligible: Story = {
  args: {
    certificateData: {
      status: 'attendance-ineligible',
      uniqueDiscussionAttendance: 2,
      numUnits: 5,
      isLastDiscussionSoonOrPassed: true,
    },
  },
};

export const MidCourse: Story = {
  args: {
    certificateData: {
      status: 'attendance-ineligible',
      uniqueDiscussionAttendance: 2,
      numUnits: 5,
      isLastDiscussionSoonOrPassed: false,
    },
  },
};

export const HasCertificate: Story = {
  args: {
    certificateData: {
      status: 'has-certificate',
      certificateId: 'cert-123',
      certificateCreatedAt: Math.floor(Date.now() / 1000),
      courseName: 'AI Safety Fundamentals',
      courseSlug: 'aisf',
      courseDetailsUrl: '/courses/aisf',
      recipientName: 'Jane Smith',
      certificationDescription: 'Completed the AI Safety Fundamentals course.',
    },
  },
};

// --- Locked panel states (muted bg, lock icon) ---

export const ActionPlanSubmitted: Story = {
  args: {
    certificateData: {
      status: 'action-plan-pending',
      meetPersonId: 'meet-person-123',
      hasSubmittedActionPlan: true,
      isLastDiscussionSoonOrPassed: true,
    },
  },
};

export const IsFacilitator: Story = {
  args: {
    certificateData: { status: 'is-facilitator' },
  },
};
