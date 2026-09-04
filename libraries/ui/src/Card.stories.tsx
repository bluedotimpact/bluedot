import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta = {
  title: 'ui/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Card header',
    subtitle: 'Body copy goes here. Swap this slot for a paragraph, or paragraph + a form field.',
    ctaText: 'Primary action',
    url: 'https://example.com',
    imageSrc: 'https://placehold.co/312x140',
    className: 'max-w-[360px]',
  },
};

export const WithoutMedia: Story = {
  args: {
    title: 'Card header',
    subtitle: 'A titled content block with a short subtitle and one CTA.',
    ctaText: 'Primary action',
    url: 'https://example.com',
    className: 'max-w-[360px]',
  },
};

export const WithBadge: Story = {
  args: {
    title: 'Card header',
    subtitleBadge: 'New',
    subtitle: 'A status-labelled item where a small tag sits next to the title.',
    url: 'https://example.com',
    className: 'max-w-[360px]',
  },
};

export const FullWidth: Story = {
  args: {
    title: 'Clickable card',
    subtitle: 'This entire card is clickable.',
    ctaText: 'Learn More',
    url: 'https://example.com',
    isFullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};
