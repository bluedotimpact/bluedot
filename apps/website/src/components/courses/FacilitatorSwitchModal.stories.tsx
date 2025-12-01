import type { Meta, StoryObj } from '@storybook/react';
import FacilitatorSwitchModal from './FacilitatorSwitchModal';

const meta = {
  title: 'website/courses/FacilitatorSwitchModal',
  component: FacilitatorSwitchModal,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FacilitatorSwitchModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    handleClose: () => {},
    initialUnitNumber: '1',
    courseSlug: 'ai-safety',
  },
};

export const DifferentUnit: Story = {
  args: {
    handleClose: () => {},
    initialUnitNumber: '3',
    courseSlug: 'ai-safety',
  },
};
