import { router } from '../trpc';
import { blogsRouter } from './blogs';
import { exercisesRouter } from './exercises';
import { jobsRouter } from './jobs';
import { projectsRouter } from './projects';
import { usersRouter } from './users';

export const appRouter = router({
  blogs: blogsRouter,
  exercises: exercisesRouter,
  jobs: jobsRouter,
  projects: projectsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
