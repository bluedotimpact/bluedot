import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Nav } from './Nav';
import imgSrc from '../public/BlueDot_Impact_Logo.svg';

const NavWrapper: React.FC<React.ComponentProps<typeof Nav>> = (props) => (
  <div className="min-h-96">
    <Nav {...props} />
  </div>
);

const meta = {
  title: 'ui/Nav',
  component: NavWrapper,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
    styles: {
      minHeight: '800px', // Set min-height for the docs version
    },
  },
  args: {
    courses: [
      { title: 'Course 1', href: '#1' },
      { title: 'Course 2', href: '#2' },
    ],
  },
} satisfies Meta<typeof NavWrapper>;

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
