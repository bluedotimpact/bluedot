import {
  deletionRequestTable, desc, eq, userTable,
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
  adminProcedure, getUserFromAuthOrThrow, impersonationRealIdentity, publicProcedure, router,
} from '../trpc';

export const deletionRequestsRouter = router({
  triggerAccountDeletion: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const subject = await db.getFirst(userTable, { filter: { id: input.userId } });
      if (!subject) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const initiator = await getUserFromAuthOrThrow(impersonationRealIdentity(ctx));

      const existingRequests = await db.scan(deletionRequestTable, { userId: subject.id });

      const failedRequest = existingRequests
        .filter((existing) => existing.status === DELETION_REQUEST_STATUS.failed)
        .sort((a, b) => (b.requestedAt ?? '').localeCompare(a.requestedAt ?? ''))[0];

      if (failedRequest) {
        const revivedRequest = await db.update(deletionRequestTable, { id: failedRequest.id, status: DELETION_REQUEST_STATUS.pending });

        logger.info(`[AccountDeletion] failed deletion request ${revivedRequest.id} for user ${subject.id} retried by admin ${initiator.email}`);

        return revivedRequest;
      }

      if (existingRequests.length > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: `A deletion request for this user already exists (status: ${existingRequests[0]!.status})` });
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
