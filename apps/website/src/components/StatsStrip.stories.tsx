import type { Meta, StoryObj } from '@storybook/react';
import StatsStrip from './StatsStrip';

const meta = {
  title: 'website/StatsStrip',
  component: StatsStrip,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Row of headline stats with an "Apply now" CTA, used on grant type pages and program pages. The CTA links to the application form of the Airtable `program` row with the given slug.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatsStrip>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleStats = [
  { label: 'Grant funding', value: 'Up to $20k' },
  { label: 'Decision time', value: '< 2 weeks' },
  { label: 'Funded so far', value: '$1.4M+' },
  { label: 'Grants made', value: '400+' },
];

// Storybook has no API, so pass the CTA explicitly rather than looking up the application form.
const primaryAction = { label: 'Apply now', url: 'https://example.com/apply' };
const secondaryAction = { label: 'Learn more', url: 'https://example.com/learn-more' };

export const Roomy: Story = {
  args: {
    slug: 'rapid', stats: sampleStats, primaryAction, secondaryAction,
  },
};

export const Compact: Story = {
  args: {
    slug: 'rapid', stats: sampleStats, primaryAction, compact: true,
  },
};
