import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// TODO work out a more idiomatic way to do this
config({ path: '.env.local' });

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    // FIXME
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    url: process.env.PG_URL!,
  },
});
