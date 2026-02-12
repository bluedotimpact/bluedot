import type { Meta, StoryObj } from '@storybook/react';
import type React from 'react';
import { useState } from 'react';
import StarRating from './StarRating';

const StarRatingWrapper: React.FC = () => {
  const [rating, setRating] = useState<number>(0);

  return <StarRating rating={rating} onChange={setRating} />;
};

const meta = {
  title: 'website/courses/StarRating',
  component: StarRatingWrapper,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  args: {},
} satisfies Meta<typeof StarRatingWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
