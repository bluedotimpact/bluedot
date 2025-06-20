import { z } from 'zod';
import {
  eq, and, or, courseTable, InferSelectModel,
} from '@bluedot/db';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';

type Course = InferSelectModel<typeof courseTable.pg>;

export type GetCoursesResponse = {
  type: 'success',
  courses: Course[],
};

export const buildFormula = ({ cadence, level }: { cadence?: string[], level?: string[] }) => {
  const formulaParts: string[] = [];

  formulaParts.push('{Display on Course Hub index} = TRUE()');

  if (cadence) {
    const cadenceChecks = [...cadence.map((c) => `{Cadence} = "${c}"`), '{Cadence} = ""'].join(', ');
    formulaParts.push(`OR(${cadenceChecks})`);
  }

  if (level) {
    const levelChecks = [...level.map((l) => `{Level} = "${l}"`), '{Level} = ""'].join(', ');
    formulaParts.push(`OR(${levelChecks})`);
  }

  return formulaParts.length > 1
    ? `AND(${formulaParts.join(', ')})`
    : formulaParts[0];
};

const coursesRequestBodySchema = z.object({
  cadence: z.array(z.string()).optional(),
  level: z.array(z.string()).optional(),
}).optional();

export type CoursesRequestBody = z.infer<typeof coursesRequestBodySchema>;

export default makeApiRoute({
  requireAuth: false,
  requestBody: coursesRequestBodySchema,
  responseBody: z.object({
    type: z.literal('success'),
    courses: z.array(z.any()),
  }),
}, async () => {
  // For now, just get all courses that should be displayed on the course hub
  const courses = await db.pg.select()
    .from(courseTable.pg)
    .where(eq(courseTable.pg.displayOnCourseHubIndex, true));

  return {
    type: 'success' as const,
    courses,
  };
});
