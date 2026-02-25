import { beforeAll } from 'vitest';
import { ensureSchemaUpToDate } from './src/lib/schema-sync';

beforeAll(async () => {
  await ensureSchemaUpToDate();
});
