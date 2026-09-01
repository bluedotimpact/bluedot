import {
  and,
  COURSE_ROLE,
  courseRegistrationTable,
  deletionRequestTable,
  desc,
  eq,
  inArray,
  isNull,
  meetPersonTable,
  ne,
  or,
  userTable,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { logger } from '@bluedot/ui/src/api';
import z from 'zod';
import db from '../../lib/api/db';
import { DELETION_REQUEST_STATUS } from '../../lib/constants';
import { runAccountDeletion } from '../../lib/api/accountDeletion';
import { normaliseEmail, verifyPublicToken } from '../../lib/api/utils';
import {
  adminProcedure, getUserFromAuthOrThrow, impersonationRealIdentity, protectedProcedure, publicProcedure, router,
} from '../trpc';

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
      or(isNull(meetPersonTable.pg.role), ne(meetPersonTable.pg.role, COURSE_ROLE.PARTICIPANT)),
    ))
    .limit(1);

  return facilitatorRecords.length > 0;
};

export const deletionRequestsRouter = router({
  adminRequestAccountDeletion: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const subject = await db.getFirst(userTable, { filter: { id: input.userId } });
      if (!subject) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const initiator = await getUserFromAuthOrThrow(impersonationRealIdentity(ctx));

      const existingRequests = await db.scan(deletionRequestTable, { userId: subject.id });

      const activeRequest = existingRequests.find((existing) => existing.status === DELETION_REQUEST_STATUS.pending || existing.status === DELETION_REQUEST_STATUS.inProgress);

      const failedRequest = existingRequests
        .filter((existing) => existing.status === DELETION_REQUEST_STATUS.failed)
        .sort((a, b) => (b.requestedAt ?? '').localeCompare(a.requestedAt ?? ''))[0];

      if (failedRequest && !activeRequest) {
        const revivedRequest = await db.update(deletionRequestTable, { id: failedRequest.id, status: DELETION_REQUEST_STATUS.pending });

        logger.info(`[AccountDeletion] failed deletion request ${revivedRequest.id} for user ${subject.id} retried by admin ${initiator.email}`);

        return { request: revivedRequest, isRetry: true };
      }

      if (existingRequests.length > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: `A deletion request for this user already exists (status: ${(activeRequest ?? existingRequests[0]!).status})` });
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

      logger.info(`[AccountDeletion] deletion request ${request.id} created for user ${subject.id} by admin ${initiator.email}`);

      return { request, isRetry: false };
    }),

  selfDeletionEligibility: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserFromAuthOrThrow(ctx.auth);

    const existingRequests = await db.scan(deletionRequestTable, { userId: user.id });

    return {
      hasEverFacilitated: await hasEverFacilitated(user.id),
      hasExistingRequest: existingRequests.length > 0,
    };
  }),

  userRequestAccountDeletion: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.impersonation) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Account deletion can\'t be requested while impersonating. Use the admin deletion requests page instead.' });
    }

    const subject = await getUserFromAuthOrThrow(ctx.auth);

    if (await hasEverFacilitated(subject.id)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Facilitators cannot delete their account through this form' });
    }

    // Only admins can retry a failed request.
    const existingRequests = await db.scan(deletionRequestTable, { userId: subject.id });
    if (existingRequests.length > 0) {
      throw new TRPCError({ code: 'CONFLICT', message: 'A deletion request for this account already exists' });
    }

    const request = await db.insert(deletionRequestTable, {
      email: normaliseEmail(subject.email),
      userId: subject.id,
      keycloakIdentifier: subject.keycloakIdentifier,
      status: DELETION_REQUEST_STATUS.pending,
      initiatedByRole: 'User',
      initiatedBy: [subject.id],
      requestedAt: new Date().toISOString(),
    });

    logger.info(`[AccountDeletion] deletion request ${request.id} created for user ${subject.id} by ${subject.email}`);

    return request;
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
