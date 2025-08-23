import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  courseRegistrationTable,
  courseTable,
  groupDiscussionTable,
  groupSwitchingTable,
  groupTable,
  InferSelectModel,
  meetPersonTable,
} from '@bluedot/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import db from '../../../../../lib/api/db';
import { stablePickCourseRegistration } from '../../../../../lib/utils';

const requestBodySchema = z.object({
  switchType: z.enum(['Switch group for one unit', 'Switch group permanently']),
  notesFromParticipant: z.string().min(1),
  oldGroupId: z.string().optional(),
  newGroupId: z.string().optional(),
  oldDiscussionId: z.string().optional(),
  newDiscussionId: z.string().optional(),
  isManualRequest: z.boolean(),
});

export type GroupSwitchingRequest = z.infer<typeof requestBodySchema>;

export type GroupSwitchingResponse = {
  type: 'success';
  groupSwitchRecord: InferSelectModel<typeof groupSwitchingTable.pg>;
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: requestBodySchema,
  responseBody: z.object({
    type: z.literal('success'),
  }),
}, async (body, { auth, raw }) => {
  const { courseSlug } = raw.req.query;

  // TODO bypass some of the validation to support manual switching
  const {
    switchType,
    oldGroupId: inputOldGroupId,
    newGroupId: inputNewGroupId,
    oldDiscussionId: inputOldDiscussionId,
    newDiscussionId: inputNewDiscussionId,
    notesFromParticipant,
    isManualRequest,
  } = body;

  if (typeof courseSlug !== 'string') {
    throw new createHttpError.BadRequest('Invalid course slug');
  }
  if (switchType === 'Switch group for one unit' && (!inputOldDiscussionId || !inputNewDiscussionId)) {
    throw new createHttpError.BadRequest('oldDiscussionId and newDiscussionId are required when switching for one unit');
  }
  if (switchType === 'Switch group permanently' && (!inputOldGroupId || !inputNewGroupId)) {
    throw new createHttpError.BadRequest('oldGroupId and newGroupId are required when switching groups permanently');
  }

  const course = await db.get(courseTable, { slug: courseSlug });

  const courseRegistration = stablePickCourseRegistration(
    await db.scan(courseRegistrationTable, {
      email: auth.email,
      decision: 'Accept',
      courseId: course.id,
    }),
  );

  if (!courseRegistration) {
    throw new createHttpError.NotFound('No course registration found');
  }

  const participant = await db.get(meetPersonTable, { applicationsBaseRecordId: courseRegistration.id });

  const participantId = participant.id;

  let unitId = null;
  let oldGroupId = null;
  let newGroupId = null;
  let oldDiscussionId = null;
  let newDiscussionId = null;
  if (switchType === 'Switch group for one unit') {
    const [oldDiscussion, newDiscussion] = await Promise.all([
      db.get(groupDiscussionTable, { id: inputOldDiscussionId }),
      db.get(groupDiscussionTable, { id: inputNewDiscussionId }),
    ]);

    if (!oldDiscussion.participantsExpected.includes(participantId)) {
      throw new createHttpError.BadRequest('User not found in old discussion');
    }
    if (newDiscussion.participantsExpected.includes(participantId)) {
      throw new createHttpError.BadRequest('User is already expected to attend new discussion');
    }
    if (oldDiscussion.unit !== newDiscussion.unit) {
      throw new createHttpError.BadRequest('Old and new discussion must be on the same course unit');
    }

    unitId = newDiscussion.unit;
    newGroupId = newDiscussion.group;
    oldDiscussionId = inputOldDiscussionId;
    newDiscussionId = inputNewDiscussionId;
  }

  if (switchType === 'Switch group permanently') {
    const [oldGroup, newGroup] = await Promise.all([
      db.get(groupTable, { id: inputOldGroupId }),
      db.get(groupTable, { id: inputNewGroupId }),
    ]);

    if (!oldGroup.participants.includes(participantId)) {
      throw new createHttpError.BadRequest('User is not a member of old group');
    }
    if (newGroup.participants.includes(participantId)) {
      throw new createHttpError.BadRequest('User is already a member of new group');
    }
    if (oldGroup.round !== newGroup.round || newGroup.round !== participant.round) {
      throw new createHttpError.BadRequest('Old or new group does not match the course round the user is registered for');
    }

    oldGroupId = oldGroup.id;
    newGroupId = newGroup.id;
  }

  const recordToCreate = {
    participant: participantId,
    requestStatus: isManualRequest ? 'Resolve' : 'Requested',
    switchType,
    notesFromParticipant,
    oldGroup: oldGroupId,
    newGroup: newGroupId,
    // Note: The reason the groupIds are values and discussionIds are single-element
    // arrays is just due to a mistake in setting up the db scheme. TODO fix this,
    // but in the meantime this does insert correctly as is.
    oldDiscussion: oldDiscussionId ? [oldDiscussionId] : [],
    newDiscussion: newDiscussionId ? [newDiscussionId] : [],
    unit: unitId,
    manualRequest: isManualRequest,
  };

  await db.insert(groupSwitchingTable, recordToCreate);

  return {
    type: 'success' as const,
  };
});
