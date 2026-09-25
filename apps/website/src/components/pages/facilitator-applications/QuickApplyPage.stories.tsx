import type { Meta, StoryObj } from '@storybook/react';
import { trpcStorybookMsw } from '../../../__tests__/trpcMswSetup.browser';
import QuickApplyPage from '../../../pages/facilitator-applications/quick-apply/index';
import type { QuickApplyPrefillData } from '../../../server/routers/facilitator-applications';

const prefillData: QuickApplyPrefillData = {
  round: {
    id: 'round-next',
    courseTitle: 'Technical AI Safety',
    courseSlug: 'technical-ai-safety',
    label: 'Week 47 Part-time',
    firstDiscussionDate: '2026-11-16',
    lastDiscussionDate: '2026-12-21',
  },
  prefill: {
    numGroupsToFacilitate: 2,
    formFeedback: '',
    prevEngagement: '',
    skills: 'Security engineering and red-teaming',
    impressiveProject: '',
    motivationToFacilitate: '',
    prevFacilitationExperience: 'Facilitated three previous rounds',
    availabilityIntervalsUTC: 'M17:00 M19:00, W17:00 W19:00',
    availabilityTimezone: 'UTC+00:00',
    availabilityComments: '',
  },
  details: {
    jobTitle: 'Research Engineer',
    organisation: 'Example AI Lab',
    careerLevel: 'Mid-career professional (3-10 years post uni)',
    profession: 'Software Engineer',
    profileUrl: 'https://www.linkedin.com/in/example',
    otherProfileUrl: '',
  },
  detailsDate: '2026-08-18T21:05:17.000Z',
};

const meta = {
  title: 'website/facilitator-applications/QuickApplyPage',
  component: QuickApplyPage,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      router: {
        pathname: '/facilitator-applications/quick-apply',
        query: { round: 'round-next' },
      },
    },
  },
} satisfies Meta<typeof QuickApplyPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithDetailsOnFile: Story = {
  parameters: {
    msw: {
      handlers: [trpcStorybookMsw.facilitatorApplications.quickApplyPrefill.query(() => prefillData)],
    },
  },
};

export const NoDetailsOnFile: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.facilitatorApplications.quickApplyPrefill.query(() => ({
          ...prefillData,
          details: {
            jobTitle: '',
            organisation: '',
            careerLevel: '',
            profession: '',
            profileUrl: '',
            otherProfileUrl: '',
          },
          detailsDate: null,
        })),
      ],
    },
  },
};
