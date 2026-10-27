import { z } from 'zod';
import createHttpError from 'http-errors';
import { groupDiscussionTable } from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';

export type RecordAttendanceRequest = {
  groupDiscussionId: string;
  participantId: string;
  reason?: string;
};

export type RecordAttendanceResponse = {
  type: 'success';
} | {
  type: 'error';
  message: string;
};

const writeAttendees = async (groupDiscussionId: string, participantIds: Set<string>) => {
  // No fullData, so this reads fresh from Airtable rather than the possibly stale Postgres replica
  const current = (await db.ensureReplicated({ table: groupDiscussionTable, id: groupDiscussionId }))?.attendees ?? [];
  const missing = [...participantIds].filter((id) => !current.includes(id));
  if (missing.length === 0) return;
  await db.update(groupDiscussionTable, { id: groupDiscussionId, attendees: [...current, ...missing] });
};

// Batches concurrent clicks per discussion so their read-modify-writes of `attendees` don't clobber each other (meet runs as one process)
const pendingByDiscussion = new Map<string, { participantIds: Set<string>; flush: Promise<void> }>();
const lastFlushByDiscussion = new Map<string, Promise<void>>();

export const recordAttendance = ({ groupDiscussionId, participantId }: { groupDiscussionId: string; participantId: string }): Promise<void> => {
  let pending = pendingByDiscussion.get(groupDiscussionId);
  if (!pending) {
    const participantIds = new Set<string>();
    const flush: Promise<void> = (lastFlushByDiscussion.get(groupDiscussionId) ?? Promise.resolve())
      .catch(() => {})
      .then(() => {
        pendingByDiscussion.delete(groupDiscussionId);
        return writeAttendees(groupDiscussionId, participantIds);
      })
      .finally(() => {
        if (lastFlushByDiscussion.get(groupDiscussionId) === flush) lastFlushByDiscussion.delete(groupDiscussionId);
      });
    lastFlushByDiscussion.set(groupDiscussionId, flush);
    pending = { participantIds, flush };
    pendingByDiscussion.set(groupDiscussionId, pending);
  }

  pending.participantIds.add(participantId);
  return pending.flush;
};

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    groupDiscussionId: z.string(),
    participantId: z.string(),
    reason: z.string().optional(),
  }),
  responseBody: z.object({
    type: z.literal('success'),
  }),
}, async (body) => {
  if (!body.groupDiscussionId) {
    throw new createHttpError.BadRequest('Missing group discussion id.');
  }

  if (!body.participantId) {
    throw new createHttpError.BadRequest('Missing participant id.');
  }

  await recordAttendance({ groupDiscussionId: body.groupDiscussionId, participantId: body.participantId });

  return {
    type: 'success' as const,
  };
});

export const maxDuration = 60;
