import '@bluedot/ui/src/shared.css';
import '../../website-25/src/globals.css'

import React from 'react';
import type { Preview, StoryFn } from '@storybook/react';

const withBluedotBase = (Story: StoryFn) => (
  <main className="bluedot-base">
    <Story />
  </main>
);

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [withBluedotBase],
};

export default preview;
