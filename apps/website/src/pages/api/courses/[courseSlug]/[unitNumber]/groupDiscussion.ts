import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  groupDiscussionTable,
  courseTable,
  courseRegistrationTable,
  meetPersonTable,
  zoomAccountTable,
  GroupDiscussion,
  Course,
  CourseRegistration,
  MeetPerson,
  ZoomAccount,
  and, eq, sql,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

export type GroupDiscussionWithZoomInfo = {
  groupDiscussion?: GroupDiscussion,
  userRole?: 'participant' | 'facilitator',
  hostKey?: string,
};

export type GetGroupDiscussionResponse = {
  type: 'success',
} & GroupDiscussionWithZoomInfo;

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    groupDiscussion: z.any().nullable(),
    userRole: z.enum(['participant', 'facilitator']).optional(),
    hostKey: z.string().optional(),
  }),
}, async (body, { auth, raw }) => {
  const { courseSlug, unitNumber } = raw.req.query;
  if (typeof courseSlug !== 'string') {
    throw new createHttpError.BadRequest('Invalid course slug');
  }
  if (typeof unitNumber !== 'string') {
    throw new createHttpError.BadRequest('Invalid unit number');
  }

  const course: Course = await db.get(courseTable, { slug: courseSlug });

  let courseRegistration: CourseRegistration | null;
  try {
    courseRegistration = await db.getFirst(courseRegistrationTable, {
      filter: {
        email: auth.email,
        decision: 'Accept',
        courseId: course.id,
      },
    });

    if (!courseRegistration) {
      return {
        type: 'success' as const,
        groupDiscussion: null,
      };
    }
  } catch (error) {
    return {
      type: 'success' as const,
      groupDiscussion: null,
    };
  }

  let participant: MeetPerson | null;
  try {
    participant = await db.getFirst(meetPersonTable, {
      filter: { applicationsBaseRecordId: courseRegistration.id },
    });

    if (!participant) {
      return {
        type: 'success' as const,
        groupDiscussion: null,
      };
    }
  } catch (error) {
    return {
      type: 'success' as const,
      groupDiscussion: null,
    };
  }

  const roundId: string | null = participant.round;

  if (!roundId) {
    return {
      type: 'success' as const,
      groupDiscussion: null,
    };
  }

  const currentTimeSeconds: number = Math.floor(Date.now() / 1000);
  const cutoffTimeSeconds: number = Math.floor((Date.now() - 15 * 60 * 1000) / 1000);

  // Get all discussions that haven't ended yet (including 15-minute grace period after end time)
  const groupDiscussions: GroupDiscussion[] = await db.pg.select()
    .from(groupDiscussionTable.pg)
    .where(
      and(
        eq(groupDiscussionTable.pg.round, roundId),
        sql`(${groupDiscussionTable.pg.participantsExpected} @> ARRAY[${participant.id}] OR ${groupDiscussionTable.pg.facilitators} @> ARRAY[${participant.id}])`,
        sql`${groupDiscussionTable.pg.endDateTime} > ${cutoffTimeSeconds}`,
      ),
    )
    .orderBy(groupDiscussionTable.pg.startDateTime);

  // Priority: Show ongoing meeting (including 15 min after end), otherwise show next upcoming
  let groupDiscussion: GroupDiscussion | null = null;

  const ongoingDiscussion: GroupDiscussion | undefined = groupDiscussions.find((d) => d.startDateTime <= currentTimeSeconds && d.endDateTime > cutoffTimeSeconds);

  if (ongoingDiscussion) {
    groupDiscussion = ongoingDiscussion;
  } else {
    groupDiscussion = groupDiscussions.find((d) => d.startDateTime > currentTimeSeconds) || null;
  }

  // Determine user role and get host key if facilitator
  let userRole: 'participant' | 'facilitator' | undefined;
  let hostKey: string | undefined;

  if (groupDiscussion) {
    if (groupDiscussion.facilitators.includes(participant.id)) {
      userRole = 'facilitator';

      if (groupDiscussion.zoomAccount) {
        try {
          const zoomAccount: ZoomAccount = await db.get(zoomAccountTable, { id: groupDiscussion.zoomAccount });
          hostKey = zoomAccount.hostKey || undefined;
        } catch (error) {
          hostKey = undefined;
        }
      }
    } else if (groupDiscussion.participantsExpected.includes(participant.id)) {
      userRole = 'participant';
    }
  }

  return {
    type: 'success' as const,
    groupDiscussion,
    userRole,
    hostKey,
  };
});
