import { router } from '../trpc';
import { adminRouter } from './admin';
import { blogsRouter } from './blogs';
import { certificatesRouter } from './certificates';
import { groupDiscussionsRouter } from './groupDiscussionsRouter';
import { jobsRouter } from './jobs';
import { projectsRouter } from './projects';
import { usersRouter } from './users';

export const appRouter = router({
  admin: adminRouter,
  certificates: certificatesRouter,
  blogs: blogsRouter,
  groupDiscussions: groupDiscussionsRouter,
  jobs: jobsRouter,
  projects: projectsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
