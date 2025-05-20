import type { Meta, StoryObj } from '@storybook/react';
import { loggedInStory, loggedOutStory } from '@bluedot/ui';

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
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  // Note: autodocs removed because it doesn't work with the global logged in/out
  args: {},
  ...loggedOutStory(),
} satisfies Meta<typeof NavWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedIn: Story = {
  args: {},
  ...loggedInStory(),
};

export const Default: Story = {
  args: {},
};
