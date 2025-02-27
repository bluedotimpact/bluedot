import type { StorybookConfig } from "@storybook/nextjs";

import { join, dirname } from "path";
import { createRequire } from 'module';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
  const require = createRequire(import.meta.url);
  return dirname(require.resolve(join(value, "package.json")));
}

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../../website-25/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../../libraries/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  staticDirs: ["../../website-25/public"],
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  addons: [
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath("@storybook/addon-styling-webpack"),
    getAbsolutePath("@storybook/addon-designs"),
  ],
  framework: '@storybook/nextjs',

  // Prevent indexing our storybook on search engines
  managerHead: (head) => `${head}<meta name="robots" content="noindex" />`,
};

export default config;