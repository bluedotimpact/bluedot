// eslint-disable-next-line import/no-extraneous-dependencies
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// eslint-disable-next-line import/no-extraneous-dependencies
import { httpLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from './trpcAlias';

/**
 * Storybook-specific tRPC Provider
 *
 * Uses the trpc client from trpcAlias.ts, which is a Storybook-specific
 * createTRPCReact instance that replaces the production createTRPCNext via Webpack alias.
 *
 * This ensures components using trpc.*.useQuery() hooks work in Storybook.
 * MSW will intercept the HTTP requests based on handlers in your stories.
 */
export const TrpcProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for faster feedback
        },
      },
    }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpLink({
          url: 'http://localhost:8000/api/trpc',
        }),
      ],
    }));

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
};
