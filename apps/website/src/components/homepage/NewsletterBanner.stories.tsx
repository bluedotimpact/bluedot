import type { Meta, StoryObj } from '@storybook/react';
import NewsletterBanner from './NewsletterBanner';

const meta = {
  title: 'Website/Homepage/NewsletterBanner',
  component: NewsletterBanner,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A newsletter signup banner with email input, decorative background image, and success/error state handling. Uses Customer.io for subscription management.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-gray-100">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NewsletterBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
