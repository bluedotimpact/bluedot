import { courseTable, unitTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

export const getAllActiveCourses = async () => {
  const courses = await db.scan(courseTable, { status: 'Active' });
  return courses;
};

export const coursesRouter = router({
  getByUnitId: publicProcedure
    .input(
      z.object({
        courseSlug: z.string().trim().min(1, 'courseSlug is required'),
        unitId: z.string().trim().min(1, 'unitId is required'),
      }),
    )
    .query(async ({ input }) => {
      const { courseSlug, unitId } = input;

      const unit = await db.get(unitTable, {
        id: unitId,
        courseSlug,
        unitStatus: 'Active',
      });

      if (!unit) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Unit not found' });
      }

      return unit;
    }),

  getAll: publicProcedure
    .query(async () => {
      return getAllActiveCourses();
    }),
});
