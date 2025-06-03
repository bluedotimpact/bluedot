/* eslint-disable no-console */
import { getInstance } from './app';
import env from './env';
import { startCronJobs } from './lib/cron';

const start = async () => {
  try {
    console.log('Server starting...');
    const instance = await getInstance();
    await instance.listen({
      port: env.PORT ? parseInt(env.PORT) : 8080,
      host: '0.0.0.0',
    }).then((address) => {
      console.log(`Server listening on ${address}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }

  startCronJobs();
};

start();
