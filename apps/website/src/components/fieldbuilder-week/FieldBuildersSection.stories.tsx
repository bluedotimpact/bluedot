import type { Meta, StoryObj } from '@storybook/react';
import FieldBuildersSection from './FieldBuildersSection';

const meta = {
  title: 'website/FieldbuilderWeek/FieldBuildersSection',
  component: FieldBuildersSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Section profiling notable AI safety fieldbuilders (MATS, Horizon, PIBBSS, etc.) with an expand/collapse toggle.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FieldBuildersSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
