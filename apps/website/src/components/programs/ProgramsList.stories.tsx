import type { Meta, StoryObj } from '@storybook/react';
import type { inferRouterOutputs } from '@trpc/server';
import { ProgramsList } from './ProgramsList';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import type { AppRouter } from '../../server/routers/_app';

type Programs = inferRouterOutputs<AppRouter>['programs']['getAll'];

const samplePrograms: Programs = [
  {
    id: 'rec_p1',
    name: 'Rapid Grants',
    status: 'Active',
    description: 'Funding for the BlueDot community to ship projects, run events, and do other concrete work on AI safety.',
    applicationForm: 'https://example.com/apply/rapid-grants',
    category: 'Funding',
    slug: 'rapid-grants',
    order: '1',
  },
  {
    id: 'rec_p2',
    name: 'Career Transition Grants',
    status: 'Active',
    description: 'Support BlueDot graduates to work full-time on impactful AI safety work.',
    applicationForm: 'https://example.com/apply/ctg',
    category: 'Funding',
    slug: 'career-transition-grant',
    order: '2',
  },
  {
    id: 'rec_p3',
    name: 'Technical AI Safety Project Sprint',
    status: 'Active',
    description: 'A 30-hour project sprint with mentorship, public output, and a clear path to portfolio-building.',
    applicationForm: 'https://example.com/apply/sprint',
    category: 'Build',
    slug: 'technical-ai-safety-project-sprint',
    order: '3',
  },
  {
    id: 'rec_p4',
    name: '1-1 advising',
    status: 'Active',
    description: 'A 30-minute call with the BlueDot team. Leave with concrete next steps.',
    applicationForm: 'https://example.com/apply/advising',
    category: 'Build',
    slug: 'advising',
    order: '4',
  },
  {
    id: 'rec_p5',
    name: 'Incubator Week',
    status: 'Active',
    description: 'Back graduates launching AI safety startups, with grant funding and an intensive week in San Francisco.',
    applicationForm: 'https://example.com/apply/incubator-week',
    category: 'Launch',
    slug: 'incubator-week',
    order: '5',
  },
];

const handlers = [
  trpcStorybookMsw.programs.getAll.query(() => samplePrograms),
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

const meta: Meta<typeof ProgramsList> = {
  title: 'website/Programs/ProgramsList',
  component: ProgramsList,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The list of active programs shown on /programs. Each row gets a CTA to its program detail page. Funding programs get a live "$X deployed across N grants" meta line from `grants.getRapidGrantStats` / `grants.getCareerTransitionGrantStats`.',
      },
    },
    msw: { handlers },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
