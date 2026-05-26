import type { Meta, StoryObj } from '@storybook/react';
import HowItWorksSection from './HowItWorksSection';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const rapidGrantsProgram = {
  id: 'rec_rapid_grants',
  name: 'Rapid Grants',
  status: 'Active',
  description: 'Funding for the BlueDot community.',
  applicationForm: 'https://example.com/apply/rapid-grants',
  category: 'Funding',
  slug: 'rapid-grants',
  order: '1',
};

const meta: Meta<typeof HowItWorksSection> = {
  title: 'website/RapidGrants/HowItWorksSection',
  component: HowItWorksSection,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: [
        trpcStorybookMsw.programs.getBySlug.query(() => rapidGrantsProgram),
      ],
    },
    docs: {
      description: {
        component: 'Five-step "How it works" card grid on /programs/rapid-grants. The "Apply" card links to the program\'s applicationForm; the trailing community card sits alongside.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
