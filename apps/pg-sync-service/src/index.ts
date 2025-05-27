/* eslint-disable no-console */
import { getInstance } from './app';
import { startCronJobs } from './lib/cron';

const start = async () => {
  try {
    console.log('Server starting...');
    const instance = await getInstance();
    await instance.listen({
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
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
