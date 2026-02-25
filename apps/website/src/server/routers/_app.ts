import { router } from '../trpc';
import { adminRouter } from './admin';
import { blogsRouter } from './blogs';
import { certificatesRouter } from './certificates';
import { courseRegistrationsRouter } from './course-registrations';
import { courseRoundsRouter } from './course-rounds';
import { coursesRouter } from './courses';
import { dropoutRouter } from './dropout';
import { exercisesRouter } from './exercises';
import { facilitatorSwitchingRouter } from './facilitator-switching';
import { feedbackRouter } from './feedback';
import { groupDiscussionsRouter } from './group-discussions';
import { groupSwitchingRouter } from './group-switching';
import { jobsRouter } from './jobs';
import { lumaRouter } from './luma';
import { meetPersonRouter } from './meet-person';
import { projectsRouter } from './projects';
import { resourcesRouter } from './resources';
import { teamMembersRouter } from './teamMembers';
import { testimonialsRouter } from './testimonials';
import { usersRouter } from './users';

export const appRouter = router({
  admin: adminRouter,
  blogs: blogsRouter,
  certificates: certificatesRouter,
  courseRegistrations: courseRegistrationsRouter,
  courseRounds: courseRoundsRouter,
  courses: coursesRouter,
  dropout: dropoutRouter,
  exercises: exercisesRouter,
  facilitators: facilitatorSwitchingRouter,
  feedback: feedbackRouter,
  groupDiscussions: groupDiscussionsRouter,
  groupSwitching: groupSwitchingRouter,
  jobs: jobsRouter,
  luma: lumaRouter,
  meetPerson: meetPersonRouter,
  projects: projectsRouter,
  resources: resourcesRouter,
  teamMembers: teamMembersRouter,
  testimonials: testimonialsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
