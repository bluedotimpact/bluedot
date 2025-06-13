import { defineConfig } from 'drizzle-kit';
import env from './src/lib/env';

export default defineConfig({
  out: './drizzle',
  schema: './src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.PG_URL,
  },
});
