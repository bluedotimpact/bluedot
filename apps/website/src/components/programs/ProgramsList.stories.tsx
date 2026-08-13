import type { Meta, StoryObj } from '@storybook/react';
import type { inferRouterOutputs } from '@trpc/server';
import { ProgramsList } from './ProgramsList';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import type { AppRouter } from '../../server/routers/_app';

type Programs = inferRouterOutputs<AppRouter>['programs']['getInPerson'];

const samplePrograms: Programs = [
  {
    id: 'rec_p5',
    name: 'Incubator Week',
    status: 'Active',
    description: 'Back graduates launching AI safety startups, with grant funding and an intensive week in San Francisco.',
    applicationForm: 'https://example.com/apply/incubator-week',
    category: 'Launch',
    slug: 'incubator-week',
    order: '1',
  },
];

const handlers = [
  trpcStorybookMsw.programs.getInPerson.query(() => samplePrograms),
];

const meta: Meta<typeof ProgramsList> = {
  title: 'website/Programs/ProgramsList',
  component: ProgramsList,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The full-time, in-person programs shown on /programs, plus AI Security Bootcamp as an external program.',
      },
    },
    msw: { handlers },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
