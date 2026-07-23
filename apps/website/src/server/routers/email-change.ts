import { sql, userTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { z } from 'zod';
import db from '../../lib/api/db';
import env from '../../lib/api/env';
import { sendEmailChangeVerification, updateCustomerIoEmail } from '../../lib/api/customerio';
import {
  getKeycloakFederatedIdentities, hasKeycloakPasswordCredential, removeKeycloakFederatedIdentity, updateKeycloakEmail,
} from '../../lib/api/keycloak';
import { createEmailChangeToken, verifyEmailChangeToken } from '../../lib/api/emailChangeToken';
import { normaliseEmail } from '../../lib/api/utils';
import { ROUTES } from '../../lib/routes';
import { adminProcedure, publicProcedure, router } from '../trpc';

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';

async function isEmailTakenByAnotherUser(newEmail: string, excludeUserId: string): Promise<boolean> {
  const existing = await db.pg.execute(sql`SELECT id FROM ${userTable.pg} WHERE LOWER(email) = ${newEmail} AND id != ${excludeUserId} LIMIT 1`);
  return existing.rows.length > 0;
}

async function unlinkStaleGoogleIdentitiesAndCheckPassword(userId: string, keycloakIdentifier: string, newEmail: string): Promise<{ passwordSetupNeeded: boolean }> {
  let remainingIdentityCount: number;
  try {
    const identities = await getKeycloakFederatedIdentities(keycloakIdentifier);
    const staleGoogleIdentities = identities.filter((identity) => identity.identityProvider === 'google' && normaliseEmail(identity.userName) !== newEmail);
    await Promise.all(staleGoogleIdentities.map((identity) => removeKeycloakFederatedIdentity(keycloakIdentifier, identity.identityProvider)));
    remainingIdentityCount = identities.length - staleGoogleIdentities.length;
  } catch (error) {
    await slackAlert(env, [`[EmailChange] Failed to unlink stale google identity for user ${userId}: ${error instanceof Error ? error.message : String(error)}`]);
    return { passwordSetupNeeded: false };
  }

  if (remainingIdentityCount > 0) {
    return { passwordSetupNeeded: false };
  }

  try {
    return { passwordSetupNeeded: !(await hasKeycloakPasswordCredential(keycloakIdentifier)) };
  } catch (error) {
    await slackAlert(env, [`[EmailChange] Failed to check password credential for user ${userId}: ${error instanceof Error ? error.message : String(error)}`]);
    return { passwordSetupNeeded: false };
  }
}

async function executeEmailChange(user: { id: string; email: string; keycloakIdentifier: string }, newEmail: string): Promise<void> {
  try {
    await updateKeycloakEmail(user.keycloakIdentifier, newEmail);
  } catch (error) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Email change failed: ${error instanceof Error ? error.message : String(error)}`,
      cause: error,
    });
  }

  await db.update(userTable, { id: user.id, email: newEmail });

  updateCustomerIoEmail(user.id, user.email, newEmail).catch((error: unknown) => slackAlert(env, [`[CIO] Email update side effect failed for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`]));
}

export const emailChangeRouter = router({
  request: adminProcedure
    .input(z.object({
      userId: z.string().min(1),
      newEmail: z.string().trim().toLowerCase().email(),
    }))
    .mutation(async ({ input }) => {
      const user = await db.getFirst(userTable, { filter: { id: input.userId } });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      if (!user.keycloakIdentifier) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'User has no linked login account' });
      }

      if (normaliseEmail(user.email) === input.newEmail) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'New email is the same as the current email' });
      }

      if (await isEmailTakenByAnotherUser(input.newEmail, user.id)) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Another user already has this email' });
      }

      const token = createEmailChangeToken({ userId: user.id, oldEmail: user.email, newEmail: input.newEmail });
      const confirmUrl = `${siteUrl()}${ROUTES.confirmEmailChange.url}?token=${encodeURIComponent(token)}`;
      await sendEmailChangeVerification({ userId: user.id, newEmail: input.newEmail, confirmUrl });

      return { sentTo: input.newEmail };
    }),

  confirm: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const payload = verifyEmailChangeToken(input.token);

      const user = await db.getFirst(userTable, { filter: { id: payload.userId } });
      if (!user || !user.keycloakIdentifier) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This link is no longer valid' });
      }

      if (normaliseEmail(user.email) === payload.newEmail) {
        const { passwordSetupNeeded } = await unlinkStaleGoogleIdentitiesAndCheckPassword(user.id, user.keycloakIdentifier, payload.newEmail);
        return { newEmail: payload.newEmail, passwordSetupNeeded };
      }

      if (normaliseEmail(user.email) !== payload.oldEmail) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This link is no longer valid' });
      }

      if (await isEmailTakenByAnotherUser(payload.newEmail, user.id)) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Another account already has this email' });
      }

      await executeEmailChange({ id: user.id, email: user.email, keycloakIdentifier: user.keycloakIdentifier }, payload.newEmail);

      const { passwordSetupNeeded } = await unlinkStaleGoogleIdentitiesAndCheckPassword(user.id, user.keycloakIdentifier, payload.newEmail);

      return { newEmail: payload.newEmail, passwordSetupNeeded };
    }),
});
