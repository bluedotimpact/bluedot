import { router } from '../trpc';
import { blogsRouter } from './blogs';
import { certificatesRouter } from './certificates';
import { jobsRouter } from './jobs';
import { usersRouter } from './users';

export const appRouter = router({
  certificates: certificatesRouter,
  blogs: blogsRouter,
  jobs: jobsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
