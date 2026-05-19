import type { Meta, StoryObj } from '@storybook/react';
import WhatCouldYouBuildSection from './WhatCouldYouBuildSection';

const meta = {
  title: 'website/FieldbuilderWeek/WhatCouldYouBuildSection',
  component: WhatCouldYouBuildSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Grid of example programs Fieldbuilder Week participants could build, plus an open-ended "your idea" prompt.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WhatCouldYouBuildSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
