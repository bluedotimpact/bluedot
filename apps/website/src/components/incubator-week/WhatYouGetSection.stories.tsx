import type { Meta, StoryObj } from '@storybook/react';
import WhatYouGetSection from './WhatYouGetSection';

const meta = {
  title: 'website/IncubatorWeek/WhatYouGetSection',
  component: WhatYouGetSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Three-up benefits grid summarising the value participants get from Incubator Week.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WhatYouGetSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
