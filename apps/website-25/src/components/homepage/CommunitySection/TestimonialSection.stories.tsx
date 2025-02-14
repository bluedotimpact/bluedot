import type { Meta, StoryObj } from '@storybook/react';
import TestimonialSection from './TestimonialSection';

const meta = {
  title: 'Homepage/TestimonialSection',
  component: TestimonialSection,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TestimonialSection>;

export default meta;
type Story = StoryObj<typeof TestimonialSection>;

export const Default: Story = {
  args: {},
};
