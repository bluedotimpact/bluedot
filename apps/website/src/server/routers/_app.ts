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
import { grantsRouter } from './grants';
import { groupDiscussionsRouter } from './group-discussions';
import { groupSwitchingRouter } from './group-switching';
import { jobsRouter } from './jobs';
import { lumaRouter } from './luma';
import { meetPersonRouter } from './meet-person';
import { missionsRouter } from './missions';
import { projectsRouter } from './projects';
import { resourcesRouter } from './resources';
import { subscriptionPreferencesRouter } from './subscription-preferences';
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
  grants: grantsRouter,
  groupDiscussions: groupDiscussionsRouter,
  groupSwitching: groupSwitchingRouter,
  jobs: jobsRouter,
  luma: lumaRouter,
  meetPerson: meetPersonRouter,
  missions: missionsRouter,
  projects: projectsRouter,
  resources: resourcesRouter,
  subscriptionPreferences: subscriptionPreferencesRouter,
  teamMembers: teamMembersRouter,
  testimonials: testimonialsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
