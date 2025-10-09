import { createTRPCMsw, httpLink } from 'msw-trpc';
// eslint-disable-next-line import/no-extraneous-dependencies
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';
import type { AppRouter } from '../server/routers/_app';

export const trpcMsw = createTRPCMsw<AppRouter>({
  links: [
    httpLink({
      url: 'http://localhost:8000/api/trpc',
    }),
  ],
});

export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
