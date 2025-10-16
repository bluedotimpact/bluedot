import { router } from '../trpc';
import { blogsRouter } from './blogs';
import { jobsRouter } from './jobs';
import { usersRouter } from './users';

export const appRouter = router({
  blogs: blogsRouter,
  jobs: jobsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
