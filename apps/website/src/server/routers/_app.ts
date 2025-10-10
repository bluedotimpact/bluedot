import { router } from '../trpc';
import { blogsRouter } from './blogs';
import { jobsRouter } from './jobs';

export const appRouter = router({
  blogs: blogsRouter,
  jobs: jobsRouter,
});

export type AppRouter = typeof appRouter;
