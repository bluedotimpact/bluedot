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
    imageSrc: '/images/intro-course.png',
    title: 'Default card',
    subtitle: 'This is a default card.',
    ctaUrl: 'https://example.com',
    ctaText: 'Learn More',
    isExternalUrl: true,
  },
};

export const ClickableCard: Story = {
  args: {
    imageSrc: '/images/intro-course.png',
    title: 'Clickable card',
    subtitle: 'This entire card is clickable.',
    ctaUrl: 'https://example.com',
    isEntireCardClickable: true,
    isExternalUrl: true,
  },
};

export const CardWithFooter: Story = {
  args: {
    imageSrc: '/images/intro-course.png',
    title: 'Card with footer',
    subtitle: 'This card has footer content.',
    ctaUrl: 'https://example.com',
    ctaText: 'Learn More',
    footerContent: <div>Footer Content Here</div>,
    isExternalUrl: true,
  },
};

export const CardWithCustomStyling: Story = {
  args: {
    imageSrc: '/images/intro-course.png',
    title: 'Card with border',
    subtitle: 'This card has a border.',
    ctaUrl: 'https://example.com',
    ctaText: 'Learn More',
    footerContent: <span>Commonly you will want to add a border or similar via `className`</span>,
    isExternalUrl: true,
    className: 'w-[250px] container-lined p-4',
  },
};
