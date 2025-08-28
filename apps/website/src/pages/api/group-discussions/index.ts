import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  groupDiscussionTable,
  courseRegistrationTable,
  meetPersonTable,
  groupTable,
  unitTable,
  sql, InferSelectModel,
} from '@bluedot/db';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';

type Group = InferSelectModel<typeof groupTable.pg>;
type Unit = InferSelectModel<typeof unitTable.pg>;

export type GroupDiscussionWithDetails = {
  id: string;
  facilitators: string[];
  participantsExpected: string[];
  attendees: string[];
  startDateTime: number;
  endDateTime: number;
  groupId: string;
  zoomAccount: string | null;
  courseSite: string | null;
  unitNumber: number | null;
  unitId: string | null;
  zoomLink: string | null;
  activityDoc: string | null;
  slackChannelId: string | null;
  round: string | null;
  groupDetails?: Group;
  unitDetails?: Unit;
};

export type GetGroupDiscussionsResponse = {
  type: 'success';
  discussions: GroupDiscussionWithDetails[];
  meetPerson?: InferSelectModel<typeof meetPersonTable.pg>;
  courseRegistration?: InferSelectModel<typeof courseRegistrationTable.pg>;
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    courseId: z.string().optional(),
    courseRegistrationId: z.string().optional(),
  }).optional(),
  responseBody: z.object({
    type: z.literal('success'),
    discussions: z.any().array(),
    meetPerson: z.any().optional(),
    courseRegistration: z.any().optional(),
  }),
}, async (body, { auth, raw }) => {
  // Support both query params and body
  const courseId = raw.req.query.courseId as string | undefined || body?.courseId;
  const courseRegistrationId = raw.req.query.courseRegistrationId as string | undefined || body?.courseRegistrationId;

  if (!courseId && !courseRegistrationId) {
    throw new createHttpError.BadRequest('Either courseId or courseRegistrationId is required');
  }

  // Get the course registration
  let courseRegistration;
  try {
    if (courseRegistrationId) {
      courseRegistration = await db.get(courseRegistrationTable, {
        id: courseRegistrationId,
        email: auth.email,
      });
    } else if (courseId) {
      courseRegistration = await db.get(courseRegistrationTable, {
        courseId,
        email: auth.email,
        decision: 'Accept',
      });
    }
  } catch {
    // No course registration found
    return {
      type: 'success' as const,
      discussions: [],
    };
  }

  if (!courseRegistration) {
    return {
      type: 'success' as const,
      discussions: [],
    };
  }

  // Get the meetPerson linked to this course registration
  let meetPerson;
  try {
    meetPerson = await db.get(meetPersonTable, {
      applicationsBaseRecordId: courseRegistration.id,
    });
  } catch {
    // No meetPerson found, return empty discussions
    return {
      type: 'success' as const,
      discussions: [],
      courseRegistration,
    };
  }

  if (!meetPerson || !meetPerson.expectedDiscussionsParticipant || meetPerson.expectedDiscussionsParticipant.length === 0) {
    return {
      type: 'success' as const,
      discussions: [],
      meetPerson,
      courseRegistration,
    };
  }

  // Get all group discussions from expectedDiscussionsParticipant
  const discussions = await db.pg.select()
    .from(groupDiscussionTable.pg)
    .where(
      sql`${groupDiscussionTable.pg.id} = ANY(ARRAY[${sql.join(
        meetPerson.expectedDiscussionsParticipant.map((id) => sql`${id}`),
        sql`, `,
      )}]::text[])`,
    )
    .orderBy(groupDiscussionTable.pg.startDateTime);

  // Fetch related groups and units
  const discussionsWithDetails: GroupDiscussionWithDetails[] = await Promise.all(
    discussions.map(async (discussion) => {
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
        if (discussion.unit) {
          unit = await db.get(unitTable, { id: discussion.unit });
        }
      } catch {
        // Unit not found
      }

      return {
        id: discussion.id,
        facilitators: discussion.facilitators,
        participantsExpected: discussion.participantsExpected,
        attendees: discussion.attendees,
        startDateTime: discussion.startDateTime,
        endDateTime: discussion.endDateTime,
        groupId: discussion.group,
        zoomAccount: discussion.zoomAccount,
        courseSite: discussion.courseSite,
        unitNumber: discussion.unitNumber,
        unitId: discussion.unit,
        zoomLink: discussion.zoomLink,
        activityDoc: discussion.activityDoc,
        slackChannelId: discussion.slackChannelId,
        round: discussion.round,
        groupDetails: group,
        unitDetails: unit,
      };
    }),
  );

  return {
    type: 'success' as const,
    discussions: discussionsWithDetails,
    meetPerson,
    courseRegistration,
  };
});
