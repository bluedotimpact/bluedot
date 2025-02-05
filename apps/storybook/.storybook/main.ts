import type { StorybookConfig } from "@storybook/react-vite";

import react from '@vitejs/plugin-react';

import { join, dirname } from "path";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
  stories: [
    "../../website-25/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../../libraries/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  core: {
    disableTelemetry: true,
  },
  addons: [
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath("@storybook/addon-styling-webpack"),
    getAbsolutePath("@storybook/addon-designs"),
  ],
  framework: '@storybook/nextjs',
  staticDirs: ["../public", "../../website-25/public"],
  async viteFinal(config) {
    // Merge custom configuration into the default config
    const { mergeConfig } = await import('vite');
 
    return mergeConfig(config, {
      plugins: [react(), ...(config?.plugins ?? [])]
    });
  },
};
export default config;
