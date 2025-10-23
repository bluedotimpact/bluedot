import { router } from '../trpc';
import { adminRouter } from './admin';
import { blogsRouter } from './blogs';
import { certificatesRouter } from './certificates';
import { jobsRouter } from './jobs';
import { meetPersonRouter } from './meet-person';
import { projectsRouter } from './projects';
import { usersRouter } from './users';

export const appRouter = router({
  admin: adminRouter,
  certificates: certificatesRouter,
  blogs: blogsRouter,
  jobs: jobsRouter,
  meetPerson: meetPersonRouter,
  projects: projectsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
