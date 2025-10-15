import { router } from '../trpc';
import { adminRouter } from './admin';
import { jobsRouter } from './jobs';
import { usersRouter } from './users';

export const appRouter = router({
  admin: adminRouter,
  jobs: jobsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
