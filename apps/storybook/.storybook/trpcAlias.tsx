// eslint-disable-next-line import/no-extraneous-dependencies
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../website/src/server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();
