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

  const {
    switchType,
    oldGroupId: inputOldGroupId,
    newGroupId: inputNewGroupId,
    oldDiscussionId: inputOldDiscussionId,
    newDiscussionId: inputNewDiscussionId,
    notesFromParticipant,
    isManualRequest,
  } = body;

  const isTemporarySwitch = switchType === 'Switch group for one unit';

  if (typeof courseSlug !== 'string') {
    throw new createHttpError.BadRequest('Invalid course slug');
  }
  if (isTemporarySwitch && !inputOldDiscussionId) {
    throw new createHttpError.BadRequest('oldDiscussionId is required when switching for one unit');
  }
  if (!isTemporarySwitch && !inputOldGroupId) {
    throw new createHttpError.BadRequest('oldGroupId is required when switching groups permanently');
  }
  if (isTemporarySwitch && !isManualRequest && !inputNewDiscussionId) {
    throw new createHttpError.BadRequest('newDiscussionId is required when switching for one unit, unless requesting a manual switch');
  }
  if (!isTemporarySwitch && !isManualRequest && !inputNewGroupId) {
    throw new createHttpError.BadRequest('newGroupId is required when switching groups permanently, unless requesting a manual switch');
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

  let unitId: string | null = null;
  let oldGroupId: string | null = null;
  let newGroupId: string | null = null;
  let oldDiscussionId: string | null = null;
  let newDiscussionId: string | null = null;
  if (isTemporarySwitch) {
    // Error will be thrown here if either are not found
    const [oldDiscussion, newDiscussion] = await Promise.all([
      db.get(groupDiscussionTable, { id: inputOldDiscussionId }),
      !isManualRequest ? db.get(groupDiscussionTable, { id: inputNewDiscussionId }) : null,
    ]);

    if (!oldDiscussion.participantsExpected.includes(participantId)) {
      throw new createHttpError.BadRequest('User not found in old discussion');
    }
    if (newDiscussion?.participantsExpected.includes(participantId)) {
      throw new createHttpError.BadRequest('User is already expected to attend new discussion');
    }
    if (newDiscussion && (oldDiscussion.unit !== newDiscussion.unit)) {
      throw new createHttpError.BadRequest('Old and new discussion must be on the same course unit');
    }

    unitId = oldDiscussion.unit;
    newGroupId = newDiscussion?.group ?? null;
    oldDiscussionId = inputOldDiscussionId!;
    newDiscussionId = inputNewDiscussionId ?? null;
  } else {
    // Error will be thrown here if either are not found
    const [oldGroup, newGroup] = await Promise.all([
      db.get(groupTable, { id: inputOldGroupId }),
      !isManualRequest ? db.get(groupTable, { id: inputNewGroupId }) : null,
    ]);

    if (!oldGroup.participants.includes(participantId)) {
      throw new createHttpError.BadRequest('User is not a member of old group');
    }
    if (newGroup?.participants.includes(participantId)) {
      throw new createHttpError.BadRequest('User is already a member of new group');
    }
    if (newGroup && (oldGroup.round !== newGroup.round || newGroup.round !== participant.round)) {
      throw new createHttpError.BadRequest('Old or new group does not match the course round the user is registered for');
    }

    oldGroupId = oldGroup.id;
    newGroupId = newGroup?.id ?? null;
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
