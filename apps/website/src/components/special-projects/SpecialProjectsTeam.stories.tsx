import type { Meta, StoryObj } from '@storybook/react';
import SpecialProjectsTeam from './SpecialProjectsTeam';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const meta: Meta<typeof SpecialProjectsTeam> = {
  title: 'website/special-projects/SpecialProjectsTeam',
  component: SpecialProjectsTeam,
  decorators: [(Story) => <div className="mx-auto w-full max-w-prose"><Story /></div>],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [trpcStorybookMsw.teamMembers.getAll.query(() => [
        {
          name: 'Joshua Landes',
          jobTitle: 'Head of Special Projects',
          imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/recvR1OJPD06Trzhm/1',
          url: 'https://www.linkedin.com/in/josh-landes12/',
        },
        {
          name: 'Harry Waterman',
          jobTitle: 'Special Projects',
          imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/reciRgsGNsPfghDwb/1',
          url: 'https://harrywaterman.com/',
        },
      ])],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Unavailable: Story = {
  parameters: { msw: { handlers: [trpcStorybookMsw.teamMembers.getAll.query(() => [])] } },
};
