import { initServer } from '@ts-rest/fastify';
import { initContract } from '@ts-rest/core';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import createHttpError from 'http-errors';
import { z } from 'zod';

const c = initContract();

const localContract = c.router({
  hello: {
    method: 'GET',
    path: '/hello',
    responses: {
      200: z.object({ message: z.string() }),
    },
  },
});

export const routesPlugin: FastifyPluginAsync = fp(async (instance) => {
  const s = initServer();

  const router = s.router(localContract, {
    hello: async () => {
      return {
        status: 200,
        body: { message: 'Hello, world!' },
      };
    },
  });

  s.registerRouter(localContract, router, instance, {
    responseValidation: true,
    requestValidationErrorHandler: (error) => {
      const messages = [error.body, error.pathParams, error.headers].flatMap((zodError) => zodError?.issues.map((i) => `[${i.path.join('.')}] ${i.message}`) ?? []);
      throw new createHttpError.BadRequest(`Request validation failed: ${messages.join(', ')}`);
    },
  });
});
