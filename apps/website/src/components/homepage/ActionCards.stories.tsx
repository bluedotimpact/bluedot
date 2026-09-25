import type { Meta, StoryObj } from '@storybook/react';
import ActionCards from './ActionCards';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const grants = [
  {
    id: 'rapid', name: 'Rapid Grants', slug: 'rapid', category: 'Funding',
    description: 'Funding for projects.', applicationForm: null, order: '1', status: 'Active',
  },
  {
    id: 'career', name: 'Career Transition Grants', slug: 'career-transition', category: 'Funding',
    description: 'Funding for career transitions.', applicationForm: null, order: '2', status: 'Active',
  },
];
const programs = [{
  id: 'incubator', name: 'Incubator Week', slug: 'incubator-week', category: 'Launch',
  description: 'Build your idea in San Francisco.', applicationForm: null, order: '1', status: 'Active',
}];

const meta: Meta<typeof ActionCards> = {
  title: 'Website/Homepage/ActionCards',
  component: ActionCards,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [
        trpcStorybookMsw.programs.getGrants.query(() => grants),
        trpcStorybookMsw.programs.getInPerson.query(() => programs),
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
