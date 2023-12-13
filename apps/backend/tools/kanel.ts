import { processDatabase } from 'kanel';
import { makeKyselyHook } from 'kanel-kysely';
import { env } from '../src/env';
import { migrateDb } from '../src/db/migrations/migrator';
import { db } from '../src/db/client';

async function run() {
  await migrateDb();
  await db.destroy();

  await processDatabase({
    connection: {
      connectionString: env.DATABASE_CONNECTION_STRING,
    },

    preDeleteOutputFolder: true,
    outputPath: './src/db/generated',

    preRenderHooks: [makeKyselyHook()],
  });
}

run();
