import type { StorybookConfig } from '@storybook/nextjs';

import { join, dirname } from 'path';
import { createRequire } from 'module';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
  const require = createRequire(import.meta.url);
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../../website/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../../../libraries/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  staticDirs: ['../../website/public', '../public'],
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  addons: [
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-interactions'),
    getAbsolutePath('@storybook/addon-styling-webpack'),
    getAbsolutePath('@storybook/addon-designs'),
  ],
  framework: '@storybook/nextjs',

  // Prevent indexing our storybook on search engines
  managerHead: (head) => `${head}<meta name="robots" content="noindex" />`,

  webpackFinal: async (config) => {
    // Replace the production tRPC client with Storybook-specific one
    // This ensures components using trpc hooks get the right instance
    if (config.resolve) {
      const trpcAliasPath = join(__dirname, 'trpcAlias.ts');
      const utilsTrpcPath = join(__dirname, '../../website/src/utils/trpc');

      config.resolve.alias = {
        ...config.resolve.alias,
        // Use absolute path to target the actual utils/trpc file
        [utilsTrpcPath]: trpcAliasPath,
      };
    }

    return config;
  },
};

export default config;
