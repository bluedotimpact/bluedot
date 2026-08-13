import type { Meta, StoryObj } from '@storybook/react';
import { DraftGrantPage } from './DraftGrantPage';

const meta = {
  title: 'Website/Grants/DraftGrantPage',
  component: DraftGrantPage,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: false,
      router: {
        pathname: '/grants/media',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DraftGrantPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const mediaGrantArgs = {
  title: 'Media Grants',
  description: 'Funding for media that helps more people understand AI safety and biosecurity.',
  path: '/grants/media',
  supportCopy: 'Independent media projects that make important ideas clearer and reach audiences who would not otherwise encounter them.',
  audienceCopy: 'Creators with a clear audience, a strong idea, and a credible plan to publish useful work.',
};

export const Default: Story = {
  args: mediaGrantArgs,
};

export const MediaGrant: Story = {
  args: mediaGrantArgs,
};

export const SeedGrant: Story = {
  args: {
    title: 'Seed Grants',
    description: 'Early funding for promising new projects and organisations.',
    path: '/grants/seed',
    supportCopy: 'Early work that tests a promising approach to reducing risks from advanced AI or biological threats.',
    audienceCopy: 'Founders and project leads with evidence of relevant ability and a concrete plan for an initial phase of work.',
  },
};
