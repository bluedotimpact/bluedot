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

export type GetGroupDiscussionResponse = {
  type: 'success';
  discussion: GroupDiscussion | null;
};

export default makeApiRoute({
  requireAuth: false, // Public endpoint for fetching discussion details
  responseBody: z.object({
    type: z.literal('success'),
    discussion: z.any().nullable(),
  }),
}, async (_, { raw }) => {
  const discussionId = raw.req.query.id as string;

  if (!discussionId) {
    return {
      type: 'success' as const,
      discussion: null,
    };
  }

  let discussion;
  try {
    discussion = await db.get(groupDiscussionTable, { id: discussionId });
  } catch {
    return {
      type: 'success' as const,
      discussion: null,
    };
  }

  if (!discussion) {
    return {
      type: 'success' as const,
      discussion: null,
    };
  }

  // Fetch related group and unit
  let group;
  let unit;

  try {
    if (discussion.group) {
      group = await db.get(groupTable, { id: discussion.group });
    }
  } catch {
    // Group not found
  }

  try {
    // Prefer courseBuilderUnitRecordId over unit field
    if (discussion.courseBuilderUnitRecordId) {
      unit = await db.get(unitTable, { id: discussion.courseBuilderUnitRecordId });
    } else if (discussion.unit) {
      unit = await db.get(unitTable, { id: discussion.unit });
    }
  } catch {
    // Unit not found
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
