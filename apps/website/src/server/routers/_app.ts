import { router } from '../trpc';
import { courseRegistrationsRouter } from './course-registrations';
import { jobsRouter } from './jobs';
import { usersRouter } from './users';

export const appRouter = router({
  courseRegistrations: courseRegistrationsRouter,
  jobs: jobsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
