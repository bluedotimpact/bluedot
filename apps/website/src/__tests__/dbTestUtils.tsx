import { beforeAll, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { unstable_localLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import { pushTestSchema, resetTestDb, type TestPgAirtableDb } from '@bluedot/db';
import type { AppRouter } from '../server/routers/_app';
import type { Context } from '../server/context';
import { appRouter } from '../server/routers/_app';
import db from '../lib/api/db';

// Test DB with widened insert type (accepts optional id)
export const testDb = db as unknown as TestPgAirtableDb;

export const testAuthContextLoggedOut: Context = {
  auth: null,
  impersonation: null,
  userAgent: 'test-agent',
};

export const testAuthContextLoggedIn: Context = {
  auth: {
    email: 'test@example.com',
    sub: 'test-sub',
    iss: 'test-issuer',
    aud: 'test-audience',
    exp: Math.floor(Date.now() / 1000) + 3600,
    email_verified: true,
  },
  impersonation: null,
  userAgent: 'test-agent',
};

export function setupDbTests() {
  beforeAll(async () => {
    await pushTestSchema(db);
  });

  beforeEach(async () => {
    await resetTestDb(db);
  });
}

// Server-side caller, for router tests that don't render components
export const createCaller = (ctx: Context = testAuthContextLoggedOut) => appRouter.createCaller(ctx);

// React provider, for front-end tests that render components *and* call tRPC routes which hit the database

const trpcTest = createTRPCReact<AppRouter>();
export const createTrpcDbProvider = (ctx: Context = testAuthContextLoggedOut) => {
  const trpcClient = trpcTest.createClient({
    links: [
      // Alternative to httpLink to support running in tests without setting up a full HTTP round trip.
      // This does JSON serialisation and deserialization but has other discrepancies from the HTTP version (e.g. no headers are sent).
      // If this causes tests to be unrealistic, it is possible to set up a dummy HTTP server during tests. It's just more boilerplate
      unstable_localLink({
        router: appRouter,
        createContext: async () => ctx,
      }),
    ],
  });

  return ({ children }: { children: React.ReactNode }) => {
    const [queryClient] = useState(() => new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }));

    return (
      <trpcTest.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </trpcTest.Provider>
    );
  };
};
