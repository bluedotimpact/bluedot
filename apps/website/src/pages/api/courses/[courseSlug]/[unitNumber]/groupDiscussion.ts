import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  groupDiscussionTable,
  and, eq, sql, InferSelectModel,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

type GroupDiscussion = InferSelectModel<typeof groupDiscussionTable.pg>;

export type GetGroupDiscussionResponse = {
  type: 'success',
  groupDiscussion?: GroupDiscussion,
};

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    groupDiscussion: z.any().nullable(),
  }),
}, async (body, { auth, raw }) => {
  const { courseSlug, unitNumber } = raw.req.query;
  if (typeof courseSlug !== 'string') {
    throw new createHttpError.BadRequest('Invalid course slug');
  }
  if (typeof unitNumber !== 'string') {
    throw new createHttpError.BadRequest('Invalid unit number');
  }

  const cutoffTimeSeconds = Math.floor((Date.now() - 15 * 60 * 1000) / 1000);

  // Look up group discussions for this user that haven't ended yet (with 15 min leeway)
  const groupDiscussions = await db.pg.select()
    .from(groupDiscussionTable.pg)
    .where(
      and(
        sql`${groupDiscussionTable.pg.participantEmailsExpected} @> ARRAY[${auth.email}]`,
        sql`${groupDiscussionTable.pg.courseSite} ~ ${`${courseSlug}/?$`}`,
        eq(groupDiscussionTable.pg.unitNumber, unitNumber),
        sql`${groupDiscussionTable.pg.endDateTime} > ${cutoffTimeSeconds}`,
      ),
    )
    .orderBy(groupDiscussionTable.pg.startDateTime);

  const groupDiscussion = groupDiscussions[0] || null;

  return {
    type: 'success' as const,
    groupDiscussion,
  };
});
