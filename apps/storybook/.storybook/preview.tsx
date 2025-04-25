import './globals.css'
import '../../website/src/globals.css'

import React from 'react';
import type { Preview, StoryFn } from '@storybook/react';

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
};

export default preview;
