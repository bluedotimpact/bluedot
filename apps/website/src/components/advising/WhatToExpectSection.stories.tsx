import type { Meta, StoryObj } from '@storybook/react';
import WhatToExpectSection from './WhatToExpectSection';

const meta = {
  title: 'website/Advising/WhatToExpectSection',
  component: WhatToExpectSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Section detailing what an advisee can expect before, during, and after a 1-1 advising call.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WhatToExpectSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
