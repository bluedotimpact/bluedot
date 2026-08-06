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
import { normaliseEmail } from '../../lib/api/utils';
import {
  adminProcedure, getUserFromAuthOrThrow, impersonationRealIdentity, router,
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
});
