import { z } from 'zod';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { Course, courseTable } from '../../../lib/api/db/tables';

export type GetCoursesResponse = {
  type: 'success',
  courses: Course[],
};

export const buildFormula = ({ cadence, level }: { cadence?: string[], level?: string[] }) => {
  const formulaParts: string[] = [];

  formulaParts.push('{Display on Course Hub index} = TRUE()');

  if (cadence) {
    const cadenceChecks = cadence.map((c) => `{Cadence} = "${c}"`).join(', ');
    formulaParts.push(`OR(${cadenceChecks})`);
  }

  if (level) {
    const levelChecks = level.map((l) => `{Level} = "${l}"`).join(', ');
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
}, async (body) => {
  const { cadence, level } = body ?? { cadence: undefined, level: undefined };

  const filterFormula = buildFormula({ cadence, level });

  const courses = await db.scan(courseTable, {
    filterByFormula: filterFormula,
  });

  return {
    type: 'success' as const,
    courses,
  };
});
