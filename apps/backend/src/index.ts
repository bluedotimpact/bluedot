import { app } from './app';
import { migrateDb } from './db/migrations/migrator';

const start = async () => {
  try {
    await migrateDb();
    await app.listen({ port: 8001 });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
