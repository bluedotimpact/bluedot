import { router } from '../trpc';
import { adminRouter } from './admin';
import { blogsRouter } from './blogs';
import { certificatesRouter } from './certificates';
import { courseRegistrationsRouter } from './course-registrations';
import { jobsRouter } from './jobs';
import { projectsRouter } from './projects';
import { usersRouter } from './users';

export const appRouter = router({
  admin: adminRouter,
  blogs: blogsRouter,
  certificates: certificatesRouter,
  courseRegistrations: courseRegistrationsRouter,
  jobs: jobsRouter,
  projects: projectsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
