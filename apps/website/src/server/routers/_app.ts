import { router } from '../trpc';
import { adminRouter } from './admin';
import { blogsRouter } from './blogs';
import { certificatesRouter } from './certificates';
import { coursesRouter } from './courses';
import { courseRegistrationsRouter } from './course-registrations';
import { groupDiscussionsRouter } from './group-discussions';
import { jobsRouter } from './jobs';
import { lumaRouter } from './luma';
import { meetPersonRouter } from './meet-person';
import { projectsRouter } from './projects';
import { usersRouter } from './users';

export const appRouter = router({
  admin: adminRouter,
  blogs: blogsRouter,
  certificates: certificatesRouter,
  courses: coursesRouter,
  courseRegistrations: courseRegistrationsRouter,
  groupDiscussions: groupDiscussionsRouter,
  jobs: jobsRouter,
  luma: lumaRouter,
  meetPerson: meetPersonRouter,
  projects: projectsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
