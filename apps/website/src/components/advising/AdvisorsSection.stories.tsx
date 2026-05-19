import type { Meta, StoryObj } from '@storybook/react';
import AdvisorsSection from './AdvisorsSection';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const mockAdvisors = [
  {
    name: 'Ada Lovelace',
    jobTitle: 'AI governance lead',
    imageUrl: 'https://picsum.photos/seed/ada/400/400',
    url: 'https://example.com/ada',
    advisorProfileDescription: 'Useful for navigating AI governance career paths and policy-adjacent roles.',
  },
  {
    name: 'Alan Turing',
    jobTitle: 'Technical advisor',
    imageUrl: 'https://picsum.photos/seed/alan/400/400',
    url: 'https://example.com/alan',
    advisorProfileDescription: 'Best fit for people considering technical AI safety research transitions.',
  },
  {
    name: 'Grace Hopper',
    jobTitle: 'Operations advisor',
    imageUrl: 'https://picsum.photos/seed/grace/400/400',
    url: undefined,
    advisorProfileDescription: undefined,
  },
];

const meta = {
  title: 'website/Advising/AdvisorsSection',
  component: AdvisorsSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Grid of 1-1 advisors, loaded via tRPC from the team-members table. Renders nothing if no advisors are returned.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AdvisorsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.teamMembers.getOneOnOneAdvisors.query(() => mockAdvisors),
      ],
    },
  },
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.teamMembers.getOneOnOneAdvisors.query(async () => {
          await new Promise(() => {});
          return [];
        }),
      ],
    },
  },
};
