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
    ctaText: 'Learn More',
    ctaUrl: 'https://example.com',
    imageSrc: '/images/intro-course.png',
    subtitle: 'This is a default card.',
    title: 'Default card',
  },
};

export const ClickableCard: Story = {
  args: {
    ctaUrl: 'https://example.com',
    imageSrc: '/images/intro-course.png',
    isEntireCardClickable: true,
    subtitle: 'This entire card is clickable.',
    title: 'Clickable card',
  },
};

export const FullWidthCard: Story = {
  args: {
    ctaText: 'Learn More',
    ctaUrl: 'https://example.com',
    isEntireCardClickable: true,
    isFullWidth: true,
    subtitle: 'This entire card is clickable.',
    title: 'Clickable card',
    withCTA: true,
  },
};
