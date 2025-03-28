import type { Meta, StoryObj } from '@storybook/react';

import imgSrc from '../../public/images/logo/BlueDot_Impact_Logo.svg';
import { Nav } from './Nav';

/**
 * Wrapper to add a min-height so the viewport doesn't collapse completely
 */
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
    primaryCtaText: 'Start learning',
    primaryCtaUrl: 'https://course.bluedot.org/future-of-ai',
    children: [
      <><a href="#">Support Us</a><a href="#">About</a><a href="#">Join us</a><a href="#">Blog</a></>,
    ],
  },
};
