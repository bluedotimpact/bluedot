import type { Meta, StoryObj } from '@storybook/react';
import { QuoteCarousel, type Quote } from './QuoteCarousel';

const meta: Meta<typeof QuoteCarousel> = {
  title: 'ui/QuoteCarousel',
  component: QuoteCarousel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof QuoteCarousel>;

const defaultQuotes: Quote[] = [
  {
    quote: 'This product has completely transformed how we work. The efficiency gains are incredible.',
    name: 'Sarah Johnson',
    imageSrc: 'https://i.pravatar.cc/150?img=1',
    role: 'CEO',
  },
  {
    quote: 'The best decision we made was implementing this solution. It\'s been a game-changer for our team.',
    name: 'Michael Chen',
    imageSrc: 'https://i.pravatar.cc/150?img=2',
    role: 'CTO',
  },
  {
    quote: 'I\'ve never seen such a seamless integration process. The team was incredibly supportive throughout.',
    name: 'Emily Rodriguez',
    imageSrc: 'https://i.pravatar.cc/150?img=3',
    role: 'Product Manager',
  },
];

export const Default: Story = {
  args: {
    quotes: defaultQuotes,
  },
};

export const SingleQuote: Story = {
  args: {
    quotes: [defaultQuotes[0]!],
  },
};
