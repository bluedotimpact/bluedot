import { router } from '../trpc';
import { jobsRouter } from './jobs';
import { usersRouter } from './users';

export const appRouter = router({
  jobs: jobsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
