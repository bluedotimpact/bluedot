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
    // Sadly necessary for @testing-library/jest-dom
    globals: true,
    // Generous timeouts: PGlite-backed suites run several-fold slower under CI CPU
    // contention, blowing vitest's 5s/10s defaults.
    testTimeout: 15_000,
    hookTimeout: 30_000,

    ...config?.test,

    exclude: [...defaultExclude, '**/.{turbo,next}/**', ...(config?.test?.exclude ?? [])],
  },
});
