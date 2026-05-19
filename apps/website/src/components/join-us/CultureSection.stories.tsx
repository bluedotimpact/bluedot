import type { Meta, StoryObj } from '@storybook/react';
import CultureSection from './CultureSection';

const meta = {
  title: 'website/JoinUs/CultureSection',
  component: CultureSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '"Our culture" section used on the careers / join-us page. Two-column layout: copy on the left, photo grid on the right. Content is hard-coded — edit `CultureSection.tsx` to change.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CultureSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
