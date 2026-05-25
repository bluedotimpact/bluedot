import type { Meta, StoryObj } from '@storybook/react';
import WhatThisIsForSection from './WhatThisIsForSection';

const meta = {
  title: 'website/IncubatorWeek/WhatThisIsForSection',
  component: WhatThisIsForSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Combined section explaining what Incubator Week is, the team\'s track record, and audiences it targets.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WhatThisIsForSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
