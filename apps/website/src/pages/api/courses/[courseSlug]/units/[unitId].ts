import { z } from 'zod';
import createHttpError from 'http-errors';
import { unitTable, InferSelectModel } from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

type Unit = InferSelectModel<typeof unitTable.pg>;

export type GetUnitResponse = {
  type: 'success',
  unit: Unit,
};

// Query validation schema
const querySchema = z.object({
  courseSlug: z.preprocess(
    (val) => {
      // Reject arrays
      if (Array.isArray(val)) {
        throw new Error('courseSlug cannot be an array');
      }
      // Coerce to string and trim
      return typeof val === 'string' ? val.trim() : String(val).trim();
    },
    z.string().min(1, 'courseSlug is required'),
  ),
  unitId: z.preprocess(
    (val) => {
      // Reject arrays
      if (Array.isArray(val)) {
        throw new Error('unitId cannot be an array');
      }
      // Coerce to string and trim
      return typeof val === 'string' ? val.trim() : String(val).trim();
    },
    z.string().min(1, 'unitId is required'),
  ),
});

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    unit: z.any(),
  }),
}, async (body, { raw }) => {
  // Parse and validate query parameters
  const parseResult = querySchema.safeParse(raw.req.query);

  if (!parseResult.success) {
    throw new createHttpError.BadRequest(parseResult.error.message);
  }

  const { courseSlug, unitId } = parseResult.data;

  // Get the specific unit by ID and courseSlug
  const unit = await db.get(unitTable, {
    id: unitId,
    courseSlug,
    unitStatus: 'Active',
  });

  if (!unit) {
    throw new createHttpError.NotFound('Unit not found');
  }

  return {
    type: 'success' as const,
    unit,
  };
});
