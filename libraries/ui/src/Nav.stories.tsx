import type { Meta, StoryObj } from '@storybook/react';

import { Nav } from './Nav';

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
    logo: 'https://39669.cdn.cke-cs.com/cgyAlfpLFBBiEjoXacnz/images/be262dc1ef80a786dbc507268d72f22824557f1b418c5bb0.png',
    children: [
      <><a href="#">Support Us</a><a href="#">About</a><a href="#">Join us</a><a href="#">Blog</a></>,
    ],
  },
};
