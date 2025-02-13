import type { Meta, StoryObj } from '@storybook/react';
import ProjectsSubSection from './ProjectsSubSection';

const meta = {
  title: 'Homepage/ProjectsSubSection',
  component: ProjectsSubSection,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProjectsSubSection>;

export default meta;
type Story = StoryObj<typeof ProjectsSubSection>;

export const Default: Story = {
  args: {},
};
