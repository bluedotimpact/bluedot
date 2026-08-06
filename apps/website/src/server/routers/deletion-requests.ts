import {
  and,
  COURSE_ROLE,
  courseRegistrationTable,
  deletionRequestTable,
  desc,
  eq,
  inArray,
  meetPersonTable,
  userTable,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { logger } from '@bluedot/ui/src/api';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import z from 'zod';
import db from '../../lib/api/db';
import env from '../../lib/api/env';
import { sendAccountDeletionRequestedNotice } from '../../lib/api/customerio';
import { DELETION_REQUEST_STATUS } from '../../lib/constants';
import { runAccountDeletion } from '../../lib/api/accountDeletion';
import { normaliseEmail, verifyPublicToken } from '../../lib/api/utils';
import {
  adminProcedure, getUserFromAuthOrThrow, impersonationRealIdentity, protectedProcedure, publicProcedure, router,
} from '../trpc';

const FACILITATOR_SELF_DELETION_MESSAGE = 'Unfortunately, you cannot delete your account through this form because you have been a facilitator, and this may affect other users. Please contact us if you would like your account deleted, and an admin will review your request';

const hasEverFacilitated = async (userId: string) => {
  const registrations = await db.pg
    .select({ id: courseRegistrationTable.pg.id })
    .from(courseRegistrationTable.pg)
    .where(eq(courseRegistrationTable.pg.userId, userId));

  if (registrations.length === 0) {
    return false;
  }

  const facilitatorRecords = await db.pg
    .select({ id: meetPersonTable.pg.id })
    .from(meetPersonTable.pg)
    .where(and(
      inArray(meetPersonTable.pg.applicationsBaseRecordId, registrations.map((registration) => registration.id)),
      eq(meetPersonTable.pg.role, COURSE_ROLE.FACILITATOR),
    ))
    .limit(1);

  return facilitatorRecords.length > 0;
};

const reviveOrRefuseExistingRequests = async (userId: string, conflictMessage: (status: string | null) => string) => {
  const existingRequests = await db.scan(deletionRequestTable, { userId });

  const activeRequest = existingRequests.find((existing) => existing.status === DELETION_REQUEST_STATUS.pending || existing.status === DELETION_REQUEST_STATUS.inProgress);

  const failedRequest = existingRequests
    .filter((existing) => existing.status === DELETION_REQUEST_STATUS.failed)
    .sort((a, b) => (b.requestedAt ?? '').localeCompare(a.requestedAt ?? ''))[0];

  if (failedRequest && !activeRequest) {
    return db.update(deletionRequestTable, { id: failedRequest.id, status: DELETION_REQUEST_STATUS.pending });
  }

  if (existingRequests.length > 0) {
    throw new TRPCError({ code: 'CONFLICT', message: conflictMessage((activeRequest ?? existingRequests[0]!).status) });
  }

  return null;
};

export const deletionRequestsRouter = router({
  triggerAccountDeletion: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const subject = await db.getFirst(userTable, { filter: { id: input.userId } });
      if (!subject) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const initiator = await getUserFromAuthOrThrow(impersonationRealIdentity(ctx));

      const revivedRequest = await reviveOrRefuseExistingRequests(subject.id, (status) => `A deletion request for this user already exists (status: ${status})`);
      if (revivedRequest) {
        logger.info(`[AccountDeletion] failed deletion request ${revivedRequest.id} for user ${subject.id} retried by admin ${initiator.email}`);

        return { request: revivedRequest, isRetry: true };
      }

      const request = await db.insert(deletionRequestTable, {
        email: normaliseEmail(subject.email),
        userId: subject.id,
        keycloakIdentifier: subject.keycloakIdentifier,
        status: DELETION_REQUEST_STATUS.pending,
        initiatedByRole: 'Admin',
        initiatedBy: [initiator.id],
        requestedAt: new Date().toISOString(),
      });

      sendAccountDeletionRequestedNotice({ email: subject.email })
        .catch((error: unknown) => slackAlert(env, [`[AccountDeletion] confirmation notice for deletion request ${request.id} failed: ${error instanceof Error ? error.message : String(error)}`]));

      logger.info(`[AccountDeletion] deletion request ${request.id} created for user ${subject.id} by admin ${initiator.email}`);

      return { request, isRetry: false };
    }),

  selfDeletionEligibility: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserFromAuthOrThrow(ctx.auth);

    return { hasEverFacilitated: await hasEverFacilitated(user.id) };
  }),

  requestOwnAccountDeletion: protectedProcedure.mutation(async ({ ctx }) => {
    const subject = await getUserFromAuthOrThrow(ctx.auth);

    if (await hasEverFacilitated(subject.id)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: FACILITATOR_SELF_DELETION_MESSAGE });
    }

    const initiator = ctx.impersonation ? await getUserFromAuthOrThrow(impersonationRealIdentity(ctx)) : subject;
    const initiatedByRole = ctx.impersonation ? 'Admin' : 'User';

    const revivedRequest = await reviveOrRefuseExistingRequests(subject.id, () => 'TODO copy: a deletion request for this account already exists');
    if (revivedRequest) {
      logger.info(`[AccountDeletion] failed deletion request ${revivedRequest.id} for user ${subject.id} retried by ${initiator.email}`);

      return { request: revivedRequest, isRetry: true };
    }

    const request = await db.insert(deletionRequestTable, {
      email: normaliseEmail(subject.email),
      userId: subject.id,
      keycloakIdentifier: subject.keycloakIdentifier,
      status: DELETION_REQUEST_STATUS.pending,
      initiatedByRole,
      initiatedBy: [initiator.id],
      requestedAt: new Date().toISOString(),
    });

    sendAccountDeletionRequestedNotice({ email: subject.email })
      .catch((error: unknown) => slackAlert(env, [`[AccountDeletion] confirmation notice for deletion request ${request.id} failed: ${error instanceof Error ? error.message : String(error)}`]));

    logger.info(`[AccountDeletion] deletion request ${request.id} created for user ${subject.id} by ${initiator.email}`);

    return { request, isRetry: false };
  }),

  list: adminProcedure.query(async () => db.pg
    .select()
    .from(deletionRequestTable.pg)
    .where(eq(deletionRequestTable.pg.initiatedByRole, 'Admin'))
    .orderBy(desc(deletionRequestTable.pg.requestedAt))
    .limit(100)),

  executeAccountDeletion: publicProcedure
    .input(z.object({
      publicToken: z.string().min(1),
      deletionRequestId: z.string().min(1),
    }))
    .mutation(({ input }) => {
      verifyPublicToken(input.publicToken);

      return runAccountDeletion(input.deletionRequestId);
    }),
});
