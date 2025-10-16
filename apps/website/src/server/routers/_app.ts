import { router } from '../trpc';
import { blogsRouter } from './blogs';
import { courseRegistrationsRouter } from './course-registrations';
import { jobsRouter } from './jobs';
import { usersRouter } from './users';

export const appRouter = router({
  blogs: blogsRouter,
  courseRegistrations: courseRegistrationsRouter,
  jobs: jobsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
