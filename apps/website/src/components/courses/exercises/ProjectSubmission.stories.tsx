import type { Meta, StoryObj } from '@storybook/react';
import { loggedInStory, loggedOutStory } from '@bluedot/ui/src/utils/storybook';
import { trpcStorybookMsw } from '../../../__tests__/trpcMswSetup.browser';
import type { CertificateData } from '../../../server/routers/certificates';
import { ProjectSubmission } from './ProjectSubmission';

const meta = {
  title: 'website/courses/ProjectSubmission',
  component: ProjectSubmission,
  tags: ['autodocs'],
  parameters: {
    nextjs: {
      router: {
        query: { courseSlug: 'technical-ai-safety' },
      },
    },
  },
  args: {
    courseId: 'course-1',
  },
} satisfies Meta<typeof ProjectSubmission>;

export default meta;
type Story = StoryObj<typeof meta>;

const withStatus = (status: CertificateData): Story['parameters'] => ({
  msw: {
    handlers: [trpcStorybookMsw.certificates.getStatus.query(() => status)],
  },
});

export const OpenForSubmission: Story = {
  ...loggedInStory(),
  parameters: withStatus({
    status: 'action-plan-pending',
    meetPersonId: 'recMeetPerson1',
    hasSubmittedActionPlan: false,
    hasAtMostOneDiscussionLeft: false,
  }),
};

export const AlreadySubmitted: Story = {
  ...loggedInStory(),
  parameters: withStatus({
    status: 'action-plan-pending',
    meetPersonId: 'recMeetPerson1',
    hasSubmittedActionPlan: true,
    hasAtMostOneDiscussionLeft: true,
  }),
};

// Missing too many discussions costs the certificate, not the chance to hand the project in.
export const AttendanceIneligible: Story = {
  ...loggedInStory(),
  parameters: withStatus({
    status: 'attendance-ineligible',
    uniqueDiscussionAttendance: 1,
    discussionsHeld: 4,
    meetPersonId: 'recMeetPerson1',
    hasSubmittedActionPlan: false,
  }),
};

export const HasCertificate: Story = {
  ...loggedInStory(),
  parameters: withStatus({
    status: 'has-certificate',
    certificateId: 'cert-1',
    certificateCreatedAt: 1760000000,
    recipientName: 'Test Person',
    courseName: 'Technical AI Safety',
    courseSlug: 'technical-ai-safety',
    courseDetailsUrl: '',
    certificationDescription: '',
    meetPersonId: 'recMeetPerson1',
    hasSubmittedActionPlan: true,
  }),
};

export const NotEnrolled: Story = {
  ...loggedInStory(),
  parameters: withStatus({ status: 'not-enrolled', hasUpcomingRounds: true }),
};

// Renders nothing: the congratulations page redirects facilitators away.
export const Facilitator: Story = {
  ...loggedInStory(),
  parameters: withStatus({ status: 'is-facilitator', hasUpcomingRounds: true }),
};

export const NoUpcomingRounds: Story = {
  ...loggedInStory(),
  parameters: withStatus({ status: 'not-enrolled', hasUpcomingRounds: false }),
};

export const LoggedOut: Story = {
  ...loggedOutStory(),
  parameters: withStatus({ status: 'not-authenticated', hasUpcomingRounds: true }),
};
