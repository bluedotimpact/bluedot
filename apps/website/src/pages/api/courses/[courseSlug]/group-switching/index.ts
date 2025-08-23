import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  groupSwitchingTable,
  InferSelectModel,
} from '@bluedot/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import db from '../../../../../lib/api/db';

export type GroupSwitchingRequest = {
  switchType: 'Switch group for one unit' | 'Switch group permanently';
  notesFromParticipant: string;
  oldGroupId?: string;
  newGroupId?: string;
  oldDiscussionId?: string;
  newDiscussionId?: string;
  isManualRequest: boolean;
};

export type GroupSwitchingResponse = {
  type: 'success';
  groupSwitchRecord: InferSelectModel<typeof groupSwitchingTable.pg>;
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    switchType: z.enum(['Switch group for one unit', 'Switch group permanently']),
    notesFromParticipant: z.string(),
    oldGroupId: z.string().optional(),
    newGroupId: z.string().optional(),
    oldDiscussionId: z.string().optional(),
    newDiscussionId: z.string().optional(),
    unitNumber: z.string().optional(),
    isManualRequest: z.boolean(),
  }),
  responseBody: z.object({
    type: z.literal('success'),
    groupSwitchRecord: z.any(),
  }),
}, async (body, { auth, raw }) => {
  const { courseSlug } = raw.req.query;
  if (typeof courseSlug !== 'string') {
    throw new createHttpError.BadRequest('Invalid course slug');
  }

  // // Find the user's course registration
  // const courseRegistrations = await db.scan(courseRegistrationTable, {
  //   email: auth.email,
  //   decision: 'Accept',
  // });

  // if (courseRegistrations.length === 0) {
  //   throw new createHttpError.NotFound('No course registration found');
  // }

  // // Find the course registration that matches the courseSlug pattern
  // const courseRegistration = courseRegistrations.find((cr) => cr.courseId.includes(courseSlug));

  // if (!courseRegistration) {
  //   throw new createHttpError.NotFound('Course registration not found for this course');
  // }

  // Validate required fields based on switch type
  // TODO do the correct validation
  if (!body.newGroupId) {
    throw new createHttpError.BadRequest('newGroupId is required');
  }
  if (body.switchType === 'Switch group for one unit' && (!body.newDiscussionId || !body.oldDiscussionId)) {
    // Note: Allow missing oldDiscussionId once we support "Join group for one unit"
    throw new createHttpError.BadRequest('newDiscussionId and oldDiscussionId are required when switching for one unit');
  }

  const participantId = 'rec2rB3aBq6gS3lvk'; // TODO look up course registration
  // TODO look up unitId from newDiscussionId
  const unitId = 'TODO';

  const recordToCreate = {
    participant: participantId,
    requestStatus: body.isManualRequest ? 'Resolve' : 'Requested',
    switchType: body.switchType,
    notesFromParticipant: body.notesFromParticipant,
    oldGroup: body.oldGroupId || null,
    newGroup: body.newGroupId || null,
    oldDiscussion: body.oldDiscussionId ? [body.oldDiscussionId] : [],
    newDiscussion: body.newDiscussionId ? [body.newDiscussionId] : [],
    unit: unitId,
    manualRequest: body.isManualRequest,
  };

  console.log({ recordToCreate });
  // Create the group switching record
  // const groupSwitchRecord = await db.insert(groupSwitchingTable, recordToCreate);

  return {
    type: 'success' as const,
    groupSwitchRecord,
  };
});
