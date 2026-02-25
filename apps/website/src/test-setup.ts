// Global test setup file
// This file is run before all tests in apps/website
import { beforeAll } from 'vitest';
import { pushTestSchema, type PgDatabase } from '@bluedot/db';
import db from './lib/api/db';

// Fix timezone as UTC
// eslint-disable-next-line turbo/no-undeclared-env-vars
process.env.TZ = 'UTC';

// Mock localStorage for msw CookieStore (required before msw modules are loaded)
const localStorageMock = {
  getItem: () => null,
  setItem() {},
  removeItem() {},
  clear() {},
  length: 0,
  key: () => null,
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// Push all table schemas to the in-memory PGlite database
beforeAll(async () => {
  await pushTestSchema(db.pg as PgDatabase);
});
