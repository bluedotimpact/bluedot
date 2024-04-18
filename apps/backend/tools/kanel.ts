import { escapeIdentifier, processDatabase } from 'kanel';
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
    generateIdentifierType: (col) => {
      const identifierName = escapeIdentifier(col.name);
      const typeName = identifierName.slice(0, 1).toUpperCase() + identifierName.slice(1);

      return {
        declarationType: 'typeDeclaration',
        name: typeName,
        /** Must be valid TypeScript */
        typeDefinition: [`string & { __brand: '${typeName}' }`],
        exportAs: 'named',
      };
    },

    preRenderHooks: [makeKyselyHook()],
  });
}

run();
