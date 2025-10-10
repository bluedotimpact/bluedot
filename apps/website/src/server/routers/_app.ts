import { router } from '../trpc';
import { jobsRouter } from './jobs';
import { projectsRouter } from './projects';

export const appRouter = router({
  jobs: jobsRouter,
  projects: projectsRouter,
});

export type AppRouter = typeof appRouter;
