import { getInstance } from './app';
import { migrateDb } from './db/migrations/migrator';
import { startCronJobs } from './lib/cron';

const start = async () => {
  try {
    console.log('Server starting...');
    await migrateDb();
    startCronJobs();
    const instance = await getInstance();
    await instance.listen({
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      port: process.env.PORT ? parseInt(process.env.PORT) : 8001,
      host: '0.0.0.0',
    }).then((address) => {
      console.log(`Server listening on ${address}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
