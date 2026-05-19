import type { Meta, StoryObj } from '@storybook/react';
import type { inferRouterOutputs } from '@trpc/server';
import MissionsListSection from './MissionsListSection';
import type { AppRouter } from '../../server/routers/_app';

type Missions = inferRouterOutputs<AppRouter>['missions']['getAll'];

const sampleMissions: Missions = [
  {
    id: 'rec_mission_1',
    title: 'Run a local AI safety meetup',
    subtitle: 'Bring people in your city together every few weeks.',
    slug: 'local-meetup',
    status: 'Live',
  },
  {
    id: 'rec_mission_2',
    title: 'Translate our courses',
    subtitle: 'Help us reach learners outside the anglophone world.',
    slug: 'translate-courses',
    status: 'Live',
  },
  {
    id: 'rec_mission_3',
    title: 'Build an evals dashboard',
    subtitle: 'A public site tracking benchmark results across frontier labs.',
    slug: 'evals-dashboard',
    status: 'Live',
  },
];

const meta = {
  title: 'website/Missions/MissionsListSection',
  component: MissionsListSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Lists live missions on /missions. Empty state shows a "no missions listed right now" message.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MissionsListSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    missions: sampleMissions,
  },
};

export const Empty: Story = {
  args: {
    missions: [],
  },
};
