import { fastify } from 'fastify';
import { fastifyCors } from '@fastify/cors';
import { authPlugin } from './lib/authPlugin';
import { errorHandlerPlugin } from './lib/errorHandlerPlugin';
import { routesPlugin } from './routesPlugin';

export const getInstance = async () => {
  const instance = fastify();

  await instance.register(errorHandlerPlugin);
  await instance.register(fastifyCors);

  await instance.register(async (i) => {
    // TODO re-enable auth (but with a different scheme)
    // await i.register(authPlugin);
    await i.register(routesPlugin);
  });

  return instance;
};
