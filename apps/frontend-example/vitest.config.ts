import { defineConfig, defaultExclude } from 'vitest/config';
import react from '@vitejs/plugin-react';
import * as dotenv from 'dotenv';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    env: dotenv.config({ path: '.env.test' }).parsed,
    exclude: [...defaultExclude, '**/.{turbo,next}/**'],
  },
});
