import { z } from 'zod';
import createHttpError from 'http-errors';
import { AirtableTsTable, formula } from 'airtable-ts-formula';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import {
  Course,
  courseTable,
  Unit,
  unitTable,
} from '../../../../lib/api/db/tables';

export type GetCourseResponse = {
  type: 'success',
  course: Course,
  units: Unit[],
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    course: z.any(),
    units: z.array(z.any()),
  }),
}, async (body, { raw }) => {
  const { courseSlug } = raw.req.query;
  if (typeof courseSlug !== 'string') {
    throw new createHttpError.BadRequest('Invalid course slug');
  }

  const course = (await db.scan(courseTable, {
    // TODO: remove this unnecessary cast after we drop array support for mappings in airtable-ts
    filterByFormula: formula(await db.table(courseTable) as AirtableTsTable<Course>, [
      '=',
      { field: 'slug' },
      courseSlug,
    ]),
  }))[0];
  if (!course) {
    throw new createHttpError.NotFound('Course not found');
  }

  const units = (await db.scan(unitTable, {
    filterByFormula: formula(await db.table(unitTable) as AirtableTsTable<Unit>, [
      '=',
      { field: 'courseSlug' },
      courseSlug,
    ]),
  })).sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));

  return {
    type: 'success' as const,
    course,
    units,
  };
});
