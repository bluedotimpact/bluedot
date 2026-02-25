// eslint-disable-next-line import/no-extraneous-dependencies
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

// ── Test DB with widened insert type (accepts optional id) ──────────

export const testDb = db as unknown as TestPgAirtableDb;

// ── Shared auth context ──────────────────────────────────────────────

export const defaultContext: Context = {
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

// ── DB lifecycle (call at top of any test file that uses the DB) ─────

export function setupDbTests() {
  beforeAll(async () => {
    await pushTestSchema(db);
  });

  beforeEach(async () => {
    await resetTestDb(db);
  });
}

// ── Server-side caller (for router tests) ────────────────────────────

export const createCaller = (ctx: Context = defaultContext) => appRouter.createCaller(ctx);

// ── React provider (for UI integration tests) ────────────────────────

const trpcTest = createTRPCReact<AppRouter>();

export const createTrpcDbProvider = (ctx: Context = defaultContext) => {
  const trpcClient = trpcTest.createClient({
    links: [
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

export const TrpcDbProvider = createTrpcDbProvider();

