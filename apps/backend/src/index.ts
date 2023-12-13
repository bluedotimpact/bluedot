import { app } from './app';
import { migrateDb } from './db/migrations/migrator';

const start = async () => {
  try {
    console.log('Server starting...');
    await migrateDb();
    await app.listen({
      port: 8001,
      host: '0.0.0.0',
    }).then((address) => {
      console.log(`Server listening on ${address}`);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
