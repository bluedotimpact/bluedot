import type { Meta, StoryObj } from '@storybook/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { delay } from 'msw';
import { loggedInStory, loggedOutStory } from '@bluedot/ui/src/utils/storybook';
import { FOAI_COURSE_ID } from '../../lib/constants';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import Congratulations from './Congratulations';

const MOCK_COURSE_ID = 'course-123';

const meta = {
  title: 'website/courses/Congratulations',
  component: Congratulations,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    courseTitle: 'AGI Safety Fundamentals',
    coursePath: '/courses/agi-safety-fundamentals',
    courseId: MOCK_COURSE_ID,
  },
  ...loggedInStory(),
} satisfies Meta<typeof Congratulations>;

export default meta;
type Story = StoryObj<typeof meta>;

// Card 3: not logged in
export const NotLoggedIn: Story = {
  ...loggedOutStory(),
};

// Card 3: loading
export const Loading: Story = {
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

// Card 3: error
export const Error: Story = {
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

// Card 3: has-certificate
export const HasCertificate: Story = {
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

// Card 3: action-plan-pending (not yet submitted)
export const ActionPlanPending: Story = {
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

// Card 3: action-plan-pending (already submitted)
export const ActionPlanSubmitted: Story = {
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

// Card 3: can-request (self-service certificate)
export const CanRequest: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.certificates.getStatus.query(() => ({
          status: 'can-request' as const,
        })),
        trpcStorybookMsw.certificates.request.mutation(() => ({})),
      ],
    },
  },
};

// Card 3: facilitator-pending
export const FacilitatorPending: Story = {
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

// Card 3: not-eligible
export const NotEligible: Story = {
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

// No certificate card (no courseId)
export const NoCertificateCard: Story = {
  args: {
    courseId: undefined,
  },
};

// FoAI variant: shows "Want to go deeper?" section + can-request certificate state
export const FoAI: Story = {
  args: {
    courseTitle: 'Future of AI',
    coursePath: '/courses/future-of-ai',
    courseId: FOAI_COURSE_ID,
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.certificates.getStatus.query(() => ({
          status: 'can-request' as const,
        })),
        trpcStorybookMsw.certificates.request.mutation(() => ({})),
      ],
    },
  },
};
