import { router } from '../trpc';
import { jobsRouter } from './jobs';
import { syncDashboardRouter } from './sync-dashboard';
import { usersRouter } from './users';

export const appRouter = router({
  jobs: jobsRouter,
  syncDashboard: syncDashboardRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
