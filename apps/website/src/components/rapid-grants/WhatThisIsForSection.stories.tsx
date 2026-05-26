import type { Meta, StoryObj } from '@storybook/react';
import WhatThisIsForSection from './WhatThisIsForSection';
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

const meta: Meta<typeof WhatThisIsForSection> = {
  title: 'website/RapidGrants/WhatThisIsForSection',
  component: WhatThisIsForSection,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: [
        trpcStorybookMsw.programs.getBySlug.query(() => rapidGrantsProgram),
      ],
    },
    docs: {
      description: {
        component: '"Who this is for" section on /programs/rapid-grants. Renders an intro paragraph and two decision cards (what we fund, what needs a stronger case).',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
