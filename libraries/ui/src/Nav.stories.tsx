import type { Meta, StoryObj } from '@storybook/react';

import { Nav } from './Nav';
import imgSrc from '../public/BlueDot_Impact_Logo.svg';

const meta = {
  title: 'ui/Nav',
  component: Nav,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {
    courses: [
      { title: 'Course 1', href: '#' },
      { title: 'Course 2', href: '#' },
    ],
  },
} satisfies Meta<typeof Nav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Customized: Story = {
  args: {
    logo: imgSrc,
    children: [
      <><a href="#">Support Us</a><a href="#">About</a><a href="#">Join us</a><a href="#">Blog</a></>,
    ],
  },
};
