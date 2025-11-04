import { createTRPCMsw, httpLink } from 'msw-trpc';
import type { AppRouter } from '../server/routers/_app';

/**
 * Browser-compatible tRPC MSW setup for Storybook
 * Use this in .stories.tsx files
 *
 * For Node.js test environments (Vitest), use trpcMswSetup.ts instead
 */
export const trpcStorybookMsw = createTRPCMsw<AppRouter>({
  links: [
    httpLink({
      url: 'http://localhost:8000/api/trpc',
    }),
  ],
});
