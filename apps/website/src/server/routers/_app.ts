import { router } from '../trpc';
import { courseRegistrationRouter } from './course-registration';
import { jobsRouter } from './jobs';
import { usersRouter } from './users';

export const appRouter = router({
  courseRegistrations: courseRegistrationRouter,
  jobs: jobsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
