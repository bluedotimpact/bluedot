import type { StoryFn } from '@storybook/react';

// Include globals
import '../globals.css';

// Wrap component in bluedot-base
export const withStorybookWrapper = (Story: StoryFn) => (
  <main className="bluedot-base">
    <div><Story /></div>
  </main>
);
