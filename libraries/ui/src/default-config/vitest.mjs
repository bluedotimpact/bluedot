/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig, defaultExclude } from 'vitest/config';
import react from '@vitejs/plugin-react';
import * as dotenv from 'dotenv';

/**
 * @param {import('vitest/config').UserConfig} [config] 
 * @returns {import('vitest/config').UserConfig}
 */
export const withDefaultBlueDotVitestConfig = async (config) => defineConfig({
  ...config,
  plugins: [react(), ...(config?.plugins ?? [])],
  test: {
    environment: 'happy-dom',
    env: dotenv.config({ path: '.env.test' }).parsed,

    ...config?.test,

    exclude: [...defaultExclude, '**/.{turbo,next}/**', ...(config?.test?.exclude ?? [])],
  },
});
