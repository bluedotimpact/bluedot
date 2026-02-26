// eslint-disable-next-line import/no-extraneous-dependencies
import { beforeAll, beforeEach } from 'vitest';
import { resetTestDb } from '@bluedot/db';
import { ensureSchemaUpToDate } from './lib/schema-sync';
import { db } from './lib/db';

beforeAll(async () => {
  await ensureSchemaUpToDate();
});

beforeEach(async () => {
  await resetTestDb(db);
});
