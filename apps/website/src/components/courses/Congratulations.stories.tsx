import type { Meta, StoryObj } from '@storybook/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { delay } from 'msw';
import { loggedInStory, loggedOutStory } from '@bluedot/ui/src/utils/storybook';
import { FOAI_COURSE_ID } from '../../lib/constants';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import Congratulations from './Congratulations';

const hasCertificateMock = {
  status: 'has-certificate' as const,
  certificateId: 'cert-abc-123',
  certificateCreatedAt: Math.floor(new Date('2024-11-15').getTime() / 1000),
  recipientName: 'Jane Smith',
  courseName: 'AGI Strategy',
  courseSlug: 'agi-strategy',
  certificationDescription: 'Demonstrated rigorous understanding of AGI strategy and the policy landscape shaping advanced AI development.',
  courseDetailsUrl: 'https://bluedot.org/courses/agi-strategy',
};

const meta = {
  title: 'website/courses/Congratulations',
  component: Congratulations,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="-m-8">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    courseTitle: 'AGI Strategy',
    coursePath: '/courses/agi-strategy',
    courseSlug: 'agi-strategy',
    courseId: 'course123',
  },
} satisfies Meta<typeof Congratulations>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HasCertificate: Story = {
  ...loggedInStory(),
  args: {},
  parameters: {
    msw: {
      handlers: [trpcStorybookMsw.certificates.getStatus.query(() => hasCertificateMock)],
    },
  },
};

export const NotLoggedIn: Story = {
  ...loggedOutStory(),
  args: {},
};

export const Loading: Story = {
  ...loggedInStory(),
  args: {},
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.certificates.getStatus.query(async () => {
          await delay('infinite');
          return hasCertificateMock;
        }),
      ],
    },
  },
};

export const Error: Story = {
  ...loggedInStory(),
  args: {},
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.certificates.getStatus.query(() => {
          throw new globalThis.Error('Failed to load certificate status');
        }),
      ],
    },
  },
};

export const CanRequest: Story = {
  ...loggedInStory(),
  args: {},
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.certificates.getStatus.query(() => ({ status: 'can-request' as const })),
        trpcStorybookMsw.certificates.request.mutation(() => undefined as never),
      ],
    },
  },
};

export const ActionPlanPending: Story = {
  ...loggedInStory(),
  args: {},
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.certificates.getStatus.query(() => ({
          status: 'action-plan-pending' as const,
          meetPersonId: 'meet-person-456',
          hasSubmittedActionPlan: false,
        })),
      ],
    },
  },
};

export const ActionPlanSubmitted: Story = {
  ...loggedInStory(),
  args: {},
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.certificates.getStatus.query(() => ({
          status: 'action-plan-pending' as const,
          meetPersonId: 'meet-person-456',
          hasSubmittedActionPlan: true,
        })),
      ],
    },
  },
};

export const FacilitatorPending: Story = {
  ...loggedInStory(),
  args: {},
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.certificates.getStatus.query(() => ({ status: 'facilitator-pending' as const })),
      ],
    },
  },
};

export const NoCertificateCard: Story = {
  ...loggedInStory(),
  args: {
    courseId: undefined,
  },
};

export const FoAI: Story = {
  ...loggedInStory(),
  args: {
    courseTitle: 'Future of AI',
    coursePath: '/courses/future-of-ai',
    courseSlug: 'future-of-ai',
    courseId: FOAI_COURSE_ID,
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.certificates.getStatus.query(() => ({
          ...hasCertificateMock,
          courseName: 'Future of AI',
          courseSlug: 'future-of-ai',
          courseDetailsUrl: 'https://bluedot.org/courses/future-of-ai',
        })),
      ],
    },
  },
};
