import { drizzle } from 'drizzle-orm/node-postgres';
import env from '../lib/api/env';
// TODO this unfortunately triggers a generic validateEnv. When this is in its own library that won't be such an issue

export const pg = drizzle(env.PG_URL);
