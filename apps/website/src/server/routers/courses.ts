import { courseTable } from '@bluedot/db';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

export const getAllActiveCourses = async () => {
  const courses = await db.scan(courseTable, { status: 'Active' });
  return courses;
};

export const coursesRouter = router({
  getAll: publicProcedure
    .query(async () => {
      return getAllActiveCourses();
    }),
});
