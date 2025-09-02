import { z } from 'zod';
import {
  groupDiscussionTable,
  groupTable,
  unitTable,
  InferSelectModel,
} from '@bluedot/db';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';

type GroupDiscussionBase = InferSelectModel<typeof groupDiscussionTable.pg>;
type Group = InferSelectModel<typeof groupTable.pg>;
type Unit = InferSelectModel<typeof unitTable.pg>;

export type GroupDiscussion = GroupDiscussionBase & {
  groupId: string;
  groupDetails?: Group;
  unitRecord?: Unit;
};

export type GetGroupDiscussionResponse =
  | {
    type: 'success';
    discussion: GroupDiscussion;
  }
  | {
    type: 'error';
    error: {
      code: string;
      message: string;
    };
  };

export default makeApiRoute({
  requireAuth: false, // Public endpoint for fetching discussion details
  responseBody: z.union([
    z.object({
      type: z.literal('success'),
      discussion: z.any(),
    }),
    z.object({
      type: z.literal('error'),
      error: z.object({
        code: z.string(),
        message: z.string(),
      }),
    }),
  ]),
}, async (_, { raw }) => {
  const discussionId = raw.req.query.id as string;

  if (!discussionId) {
    raw.res.status(400);
    return {
      type: 'error' as const,
      error: {
        code: 'MISSING_ID',
        message: 'Discussion ID is required',
      },
    };
  }

  let discussion;
  try {
    discussion = await db.get(groupDiscussionTable, { id: discussionId });
  } catch (error) {
    raw.res.status(500);
    return {
      type: 'error' as const,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch discussion. Please try again later.',
      },
    };
  }

  if (!discussion) {
    raw.res.status(404);
    return {
      type: 'error' as const,
      error: {
        code: 'DISCUSSION_NOT_FOUND',
        message: 'Discussion not found',
      },
    };
  }

  // Fetch related group and unit
  let unit;

  // Group is always present, fetch it
  let group;
  try {
    group = await db.get(groupTable, { id: discussion.group });
  } catch (error) {
    raw.res.status(500);
    return {
      type: 'error' as const,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch group data. Please try again later.',
      },
    };
  }

  // Unit is always present, fetch it from courseBuilderUnitRecordId
  if (!discussion.courseBuilderUnitRecordId) {
    raw.res.status(500);
    return {
      type: 'error' as const,
      error: {
        code: 'MISSING_UNIT_ID',
        message: 'Discussion is missing unit reference.',
      },
    };
  }

  try {
    unit = await db.get(unitTable, { id: discussion.courseBuilderUnitRecordId });
  } catch (error) {
    raw.res.status(500);
    return {
      type: 'error' as const,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch unit data. Please try again later.',
      },
    };
  }

  return {
    type: 'success' as const,
    discussion: {
      ...discussion,
      groupId: discussion.group,
      groupDetails: group,
      unitRecord: unit,
    },
  };
});
