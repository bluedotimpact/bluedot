import type { Meta, StoryObj } from '@storybook/react';
import TestimonialSection from './TestimonialSubSection';

const meta = {
  title: 'Website/TestimonialSection',
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
