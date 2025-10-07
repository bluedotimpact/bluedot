import { QueryClient } from '@tanstack/react-query';
import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import type { AppRouter } from '../server/routers/_app';

// Creates a separate tRPC React client for testing, independent from the production client in utils/trpc.ts.
const trpcTest = createTRPCReact<AppRouter>();

/**
 * TrpcWrapper - Test wrapper component that provides tRPC context
 *
 * Use this wrapper when rendering components that use tRPC hooks.
 *
 * @example
 * ```tsx
 * import { TrpcWrapper } from './__tests__/trpc';
 *
 * render(<MyComponent />, { wrapper: TrpcWrapper });
 * ```
 */
export const TrpcWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const trpcClient = trpcTest.createClient({
    links: [
      httpBatchLink({
        url: 'http://localhost:8000/api/trpc',
      }),
    ],
  });

  return (
    <trpcTest.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpcTest.Provider>
  );
};
