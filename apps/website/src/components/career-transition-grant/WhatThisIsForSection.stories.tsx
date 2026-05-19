import type { Meta, StoryObj } from '@storybook/react';
import WhatThisIsForSection from './WhatThisIsForSection';

const meta = {
  title: 'website/CareerTransitionGrant/WhatThisIsForSection',
  component: WhatThisIsForSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '"What this is for" section on /career-transition-grant. Intro copy plus three support cards (intros, advising, community).',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WhatThisIsForSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
