import { QueryClient } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import type { AppRouter } from '../server/routers/_app';

// Creates a separate tRPC React client for testing, independent from the production client in utils/trpc.ts.
const trpcTest = createTRPCReact<AppRouter>();

// Shared tRPC client instance for tests
const trpcClient = trpcTest.createClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:8000/api/trpc',
    }),
  ],
});

/**
 * TrpcProvider - Wrapper component that provides tRPC context
 *
 * Use this wrapper when rendering components that use tRPC hooks in tests or Storybook.
 * This is automatically applied as a decorator in Storybook via preview.tsx.
 *
 * @example Tests
 * ```tsx
 * import { TrpcProvider } from './__tests__/trpcProvider';
 *
 * render(<MyComponent />, { wrapper: TrpcProvider });
 * ```
 *
 * @example Storybook
 * ```tsx
 * // Automatically applied via withTrpc decorator in .storybook/preview.tsx
 * // No need to wrap individual stories
 * ```
 */
export const TrpcProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
  );

  return (
    <trpcTest.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpcTest.Provider>
  );
};
