import { router } from '../trpc';
import { adminRouter } from './admin';
import { blogsRouter } from './blogs';
import { exercisesRouter } from './exercises';
import { certificatesRouter } from './certificates';
import { courseRegistrationsRouter } from './course-registrations';
import { courseRoundsRouter } from './course-rounds';
import { coursesRouter } from './courses';
import { groupDiscussionsRouter } from './group-discussions';
import { groupSwitchingRouter } from './group-switching';
import { jobsRouter } from './jobs';
import { lumaRouter } from './luma';
import { meetPersonRouter } from './meet-person';
import { projectsRouter } from './projects';
import { resourcesRouter } from './resources';
import { usersRouter } from './users';

export const appRouter = router({
  admin: adminRouter,
  blogs: blogsRouter,
  exercises: exercisesRouter,
  certificates: certificatesRouter,
  courseRegistrations: courseRegistrationsRouter,
  courseRounds: courseRoundsRouter,
  courses: coursesRouter,
  groupDiscussions: groupDiscussionsRouter,
  groupSwitching: groupSwitchingRouter,
  jobs: jobsRouter,
  luma: lumaRouter,
  meetPerson: meetPersonRouter,
  projects: projectsRouter,
  resources: resourcesRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
