import '../../website/src/globals.css';
import './globals.css';

import type { Preview, StoryFn } from '@storybook/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { initialize, mswLoader } from 'msw-storybook-addon';
import { TrpcProvider } from './trpcProvider';

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

const withTrpc = (Story: StoryFn) => (
  <TrpcProvider>
    <Story />
  </TrpcProvider>
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
  decorators: [withTrpc, withBluedotBase],
  loaders: [mswLoader],
};

export default preview;
