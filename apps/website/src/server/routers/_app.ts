import { router } from '../trpc';
import { blogsRouter } from './blogs';
import { jobsRouter } from './jobs';
import { projectsRouter } from './projects';
import { resourcesRouter } from './resources';
import { usersRouter } from './users';

export const appRouter = router({
  blogs: blogsRouter,
  jobs: jobsRouter,
  projects: projectsRouter,
  resources: resourcesRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
