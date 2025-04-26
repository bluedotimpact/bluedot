import { defineConfig, defaultExclude } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...defaultExclude, '**/.{turbo,next}/**'],
  },
});
