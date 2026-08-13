import type { Meta, StoryObj } from '@storybook/react';
import type { inferRouterOutputs } from '@trpc/server';
import { GrantsList } from './GrantsList';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import type { AppRouter } from '../../server/routers/_app';

type Grants = inferRouterOutputs<AppRouter>['programs']['getGrants'];

const sampleGrants: Grants = [
  {
    id: 'rec_rapid',
    name: 'Rapid Grants',
    status: 'Active',
    description: 'Funding for concrete work on AI safety and biosecurity.',
    applicationForm: 'https://example.com/apply/rapid-grants',
    category: 'Funding',
    slug: 'rapid-grants',
    order: '1',
  },
  {
    id: 'rec_career',
    name: 'Career Transition Grants',
    status: 'Active',
    description: 'Support for people moving into full-time work on AI safety or biosecurity.',
    applicationForm: 'https://example.com/apply/career-transition',
    category: 'Funding',
    slug: 'career-transition-grant',
    order: '2',
  },
];

const handlers = [
  trpcStorybookMsw.programs.getGrants.query(() => sampleGrants),
  trpcStorybookMsw.grants.getRapidGrantStats.query(() => ({
    count: 42,
    totalAmountUsd: 184500,
    averageHoursToDecision: 48,
    p90DaysToDecision: 7,
  })),
  trpcStorybookMsw.grants.getCareerTransitionGrantStats.query(() => ({
    count: 8,
    totalAmountUsd: 360000,
    averageDaysToDecision: 14,
  })),
];

const meta: Meta<typeof GrantsList> = {
  title: 'Website/Grants/GrantsList',
  component: GrantsList,
  parameters: {
    layout: 'fullscreen',
    msw: { handlers },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithUtmCampaign: Story = {
  args: {
    utmCampaign: 'homepage-grants',
  },
};
