// eslint-disable-next-line import/no-extraneous-dependencies
import { beforeAll, beforeEach } from 'vitest';
import { pushTestSchema, resetTestDb } from '@bluedot/db';
import { db } from './lib/db';

beforeAll(async () => {
  await pushTestSchema(db);
});

beforeEach(async () => {
  await resetTestDb(db);
});
