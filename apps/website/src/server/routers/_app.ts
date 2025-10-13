import { router } from '../trpc';
import { certificatesRouter } from './certificates';
import { jobsRouter } from './jobs';
import { usersRouter } from './users';

export const appRouter = router({
  certificates: certificatesRouter,
  jobs: jobsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
