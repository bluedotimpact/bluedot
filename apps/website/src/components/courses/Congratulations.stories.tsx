import type { Meta, StoryObj } from '@storybook/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { delay } from 'msw';
import { loggedInStory, loggedOutStory } from '@bluedot/ui/src/utils/storybook';
import { FOAI_COURSE_ID } from '../../lib/constants';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import Congratulations from './Congratulations';

const meta = {
  title: 'website/courses/Congratulations',
  component: Congratulations,
  tags: ['autodocs'],
  decorators: [
    (Story, { viewMode }) => viewMode === 'docs' ? <Story /> : (
      <div style={{ paddingInline: '32rem' }}>
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
  ...loggedInStory(),
} satisfies Meta<typeof Congratulations>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotLoggedIn: Story = {
  args: {},
  ...loggedOutStory(),
};

export const Loading: Story = {
  args: {},
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.certificates.getStatus.query(async () => {
          await delay('infinite');
          return { status: 'not-eligible' } as const;
        }),
      ],
    },
  },
};

export const Error: Story = {
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

export const HasCertificate: Story = {
  args: {},
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.certificates.getStatus.query(() => ({
          status: 'has-certificate' as const,
          certificateId: 'cert-abc-123',
          issuedAt: Math.floor(new Date('2024-11-15').getTime() / 1000),
          holderName: 'Jane Smith',
        })),
      ],
    },
  },
};

export const ActionPlanPending: Story = {
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

export const CanRequest: Story = {
  args: {},
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.certificates.getStatus.query(() => ({
          status: 'can-request' as const,
        })),
        trpcStorybookMsw.certificates.request.mutation(() => undefined as never),
      ],
    },
  },
};

export const FacilitatorPending: Story = {
  args: {},
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.certificates.getStatus.query(() => ({
          status: 'facilitator-pending' as const,
        })),
      ],
    },
  },
};

export const NotEligible: Story = {
  args: {},
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.certificates.getStatus.query(() => ({
          status: 'not-eligible' as const,
        })),
      ],
    },
  },
};

export const NoCertificateCard: Story = {
  args: {
    courseId: undefined,
  },
};

export const FoAI: Story = {
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
          status: 'can-request' as const,
        })),
        trpcStorybookMsw.certificates.request.mutation(() => undefined as never),
      ],
    },
  },
};
