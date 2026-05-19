import type { Meta, StoryObj } from '@storybook/react';
import WhatThisIsForSection from './WhatThisIsForSection';

const meta = {
  title: 'website/Advising/WhatThisIsForSection',
  component: WhatThisIsForSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Section explaining what the 1-1 advising program is for and who typically benefits from it.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WhatThisIsForSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
