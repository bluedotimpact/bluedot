import { router } from '../trpc';
import { adminRouter } from './admin';
import { blogsRouter } from './blogs';
import { certificatesRouter } from './certificates';
import { courseRegistrationsRouter } from './course-registrations';
import { coursesRouter } from './courses';
import { groupDiscussionsRouter } from './group-discussions';
import { jobsRouter } from './jobs';
import { meetPersonRouter } from './meet-person';
import { projectsRouter } from './projects';
import { usersRouter } from './users';

export const appRouter = router({
  admin: adminRouter,
  blogs: blogsRouter,
  certificates: certificatesRouter,
  courseRegistrations: courseRegistrationsRouter,
  courses: coursesRouter,
  groupDiscussions: groupDiscussionsRouter,
  jobs: jobsRouter,
  meetPerson: meetPersonRouter,
  projects: projectsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
