import { Migrator } from 'kysely';
import { db } from '../client';
import { migrations } from './list';

export async function migrateDb() {
  const migrator = new Migrator({
    db,
    provider: {
      async getMigrations() {
        return Object.fromEntries(Object.entries(migrations).map(([k, up]) => [k, { up }]));
      },
    },
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((result) => {
    if (result.status === 'Success') {
      console.log(`Successfully executed database migration "${result.migrationName}"`);
    } else if (result.status === 'Error') {
      console.error(`Failed to execute database migration "${result.migrationName}"`);
    }
  });

  if (error) {
    console.error('Failed to execute database migrations', error);
    process.exit(1);
  }
}
