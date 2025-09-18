import '../../website/src/globals.css'
import './globals.css'

import React from 'react';
import type { Preview, StoryFn } from '@storybook/react';
import { initialize, mswLoader } from 'msw-storybook-addon';
 
/*
 * Initializes MSW
 * See https://github.com/mswjs/msw-storybook-addon#configuring-msw
 */
initialize();

const withBluedotBase = (Story: StoryFn) => (
  <main className="text-bluedot-black antialiased p-8">
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
  loaders: [mswLoader],
};

export default preview;
