import { router } from '../trpc';
import { adminRouter } from './admin';
import { blogsRouter } from './blogs';
import { certificatesRouter } from './certificates';
import { groupDiscussionsRouter } from './groupDiscussionsRouter';
import { jobsRouter } from './jobs';
import { meetPersonRouter } from './meet-person';
import { projectsRouter } from './projects';
import { usersRouter } from './users';

export const appRouter = router({
  admin: adminRouter,
  blogs: blogsRouter,
  certificates: certificatesRouter,
  groupDiscussions: groupDiscussionsRouter,
  jobs: jobsRouter,
  meetPerson: meetPersonRouter,
  projects: projectsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
