import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import type { AppRouter } from '../server/routers/_app';

// Creates a separate tRPC React client for testing, independent from the production client in utils/trpc.ts.
const trpcTest = createTRPCReact<AppRouter>();

// Shared tRPC client instance for tests
const trpcClient = trpcTest.createClient({
  links: [
    httpLink({
      url: 'http://localhost:8000/api/trpc',
    }),
  ],
});

/**
 * TrpcProvider - Test wrapper component that provides tRPC context
 *
 * Use this wrapper when rendering components that use tRPC hooks.
 *
 * @example
 * ```tsx
 * import { TrpcProvider } from './__tests__/trpcProvider';
 *
 * render(<MyComponent />, { wrapper: TrpcProvider });
 * ```
 */
export const TrpcProvider = ({ children }: { children: React.ReactNode }) => {
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
