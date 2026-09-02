import { courseRegistrationTable, sql, userTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { logger } from '@bluedot/ui/src/api';
import { loginPresets } from '@bluedot/ui/src/Login';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import z from 'zod';
import db from '../../lib/api/db';
import env from '../../lib/api/env';
import { sendEmailChangeRequestedNotice, sendEmailChangeVerification, updateCustomerIoEmail } from '../../lib/api/customerio';
import { createEmailChangeToken, verifyEmailChangeToken } from '../../lib/api/emailChangeToken';
import {
  adminRequest, type LoginMethods, unlinkStaleGoogleIdentities, updateKeycloakEmail, updateKeycloakPassword, verifyKeycloakPassword,
} from '../../lib/api/keycloak';
import { normaliseEmail } from '../../lib/api/utils';
import { ONE_MINUTE_MS } from '../../lib/constants';
import { newEmailSchema } from '../../lib/schemas/user/changeEmail.schema';
import { changePasswordSchema } from '../../lib/schemas/user/changePassword.schema';
import { updateNameSchema } from '../../lib/schemas/user/me.schema';
import { ROUTES } from '../../lib/routes';
import {
  adminProcedure, getUserFromAuthOrThrow, impersonationRealIdentity, protectedProcedure, publicProcedure, router,
} from '../trpc';

const linkNoLongerValid = () => new TRPCError({ code: 'BAD_REQUEST', message: 'This link is no longer valid' });

async function isEmailTaken(email: string, excludeUserId: string, excludeUserSub: string): Promise<boolean> {
  const [loginAccounts, keycloakAccounts] = await Promise.all([
    db.pg.execute<{ id: string }>(sql`SELECT id FROM ${userTable.pg} WHERE LOWER(TRIM(email)) = ${email} AND id != ${excludeUserId} LIMIT 1`),
    adminRequest<{ id: string }[]>({ method: 'get', path: `/users?email=${encodeURIComponent(email)}&exact=true` }),
  ]);

  return loginAccounts.rows.length > 0 || keycloakAccounts.some((account: { id: string }) => account.id !== excludeUserSub);
}

const getEmailChangeConfirmUrl = (token: string) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';
  return `${siteUrl}${ROUTES.confirmEmailChange.url}?token=${encodeURIComponent(token)}`;
};

async function sendEmailChangeConfirmation(
  user: { id: string; email: string; keycloakIdentifier: string | null },
  newEmail: string,
): Promise<void> {
  if (!user.keycloakIdentifier) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'User has no linked login account' });
  }

  if (normaliseEmail(user.email) === newEmail) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'New email is the same as the current email' });
  }

  if (await isEmailTaken(newEmail, user.id, user.keycloakIdentifier)) {
    throw new TRPCError({ code: 'CONFLICT', message: 'Another user already has this email' });
  }

  const token = await createEmailChangeToken({ userId: user.id, oldEmail: user.email, newEmail });
  await sendEmailChangeVerification({ oldEmail: user.email, newEmail, confirmUrl: getEmailChangeConfirmUrl(token) });
}

const RATE_LIMIT_WINDOW_MINUTES = 30;
const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_MINUTES * ONE_MINUTE_MS;
const RATE_LIMIT_MAX_ATTEMPTS = 3;

const emailChangeAttemptsByUserId = new Map<string, number[]>();

const assertWithinEmailChangeRateLimit = (userId: string): void => {
  const now = Date.now();
  const recent = (emailChangeAttemptsByUserId.get(userId) ?? []).filter((at) => now - at < RATE_LIMIT_WINDOW_MS);
  emailChangeAttemptsByUserId.set(userId, recent);

  if (recent.length >= RATE_LIMIT_MAX_ATTEMPTS) {
    const minutesLeft = Math.max(1, Math.ceil((Math.min(...recent) + RATE_LIMIT_WINDOW_MS - now) / ONE_MINUTE_MS));
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `You've tried to change your email ${RATE_LIMIT_MAX_ATTEMPTS} times in the last ${RATE_LIMIT_WINDOW_MINUTES} minutes. If you're waiting for a confirmation email, check your spam folder, or try again in about ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
    });
  }
};

const recordEmailChangeAttempt = (userId: string): void => {
  emailChangeAttemptsByUserId.set(userId, [...(emailChangeAttemptsByUserId.get(userId) ?? []), Date.now()]);
};

export const resetEmailChangeRateLimits = (): void => {
  emailChangeAttemptsByUserId.clear();
};

// By the time this runs the email change has already been applied in Keycloak and the user table,
// and rolling that back is hard. So on failure we accept partial success: the email change stands,
// and the stale Google identity is left for manual cleanup via the Slack alert.
async function unlinkStaleGoogleIdentitiesOrAlert(userId: string, keycloakIdentifier: string, newEmail: string): Promise<{ loginMethods: LoginMethods | null }> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return { loginMethods: await unlinkStaleGoogleIdentities(keycloakIdentifier, newEmail) };
    } catch (error) {
      lastError = error;
    }
  }

  await slackAlert(env, [
    `[EmailChange] Email for user ${userId} changed successfully to ${newEmail}, but stale Google identity cleanup failed after 3 attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}. The old Google account may still be able to sign in. Check the Keycloak user and remove the stale Google identity manually.`,
  ]);
  return { loginMethods: null };
}

async function propagateEmailToCourseRegistrations(userId: string, newEmail: string): Promise<void> {
  const registrations = await db.scan(courseRegistrationTable, { userId });
  const errors: unknown[] = [];
  for (const registration of registrations) {
    // Registrations with an empty email are left empty: filling them could wake dormant Airtable automation triggers
    if (registration.email && normaliseEmail(registration.email) !== newEmail) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await db.update(courseRegistrationTable, { id: registration.id, email: newEmail });
      } catch (error) {
        errors.push(error);
      }
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors, `Failed to update ${errors.length} registration(s): ${errors.map((e) => (e instanceof Error ? e.message : String(e))).join('; ')}`);
  }
}

export const usersRouter = router({
  getUser: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await getUserFromAuthOrThrow(ctx.auth);
      // Update lastSeenAt timestamp
      return db.update(userTable, {
        id: user.id,
        lastSeenAt: new Date().toISOString(),
      });
    }),

  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.impersonation) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot change password when impersonating another user' });
      }

      const { currentPassword, newPassword } = input;
      const userEmail = ctx.auth.email;
      const userSub = ctx.auth.sub;

      // Step 1: Verify current password with Keycloak
      const isPasswordValid = await verifyKeycloakPassword(userEmail, currentPassword);
      if (!isPasswordValid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Incorrect password' });
      }

      // Step 2: Update password in Keycloak
      await updateKeycloakPassword(userSub, newPassword);

      return {
        message: 'Password updated successfully',
      };
    }),

  // publicProcedure because it runs before login completes, so the token isn't in the auth store yet
  ensureExists: publicProcedure
    .input(z.object({
      token: z.string().min(1),
      initialUtmSource: z.string().trim().max(255).nullish(),
      initialUtmCampaign: z.string().trim().max(255).nullish(),
      initialUtmContent: z.string().trim().max(255).nullish(),
    }))
    .mutation(async ({ input }) => {
      let auth;
      try {
        // Must verify against the same login preset the oauth-callback page authenticates with
        auth = await loginPresets.keycloak.verifyAndDecodeToken(input.token);
      } catch {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid login token' });
      }

      const { sub, name } = auth;

      const [existingUserByEmail, existingUserByKeycloakIdentifier] = await Promise.all([
        db.getFirst(userTable, {
          filter: { email: auth.email },
        }),
        // Skip the keycloakIdentifier lookup if `sub` is somehow empty so we never persist an empty identifier
        sub
          ? db.getFirst(userTable, { filter: { keycloakIdentifier: sub } })
          : Promise.resolve(null),
      ]);

      const getInitialUtmFields = (existingUser?: typeof existingUserByEmail) => ({
        ...(input.initialUtmSource && !existingUser?.utmSource && { utmSource: input.initialUtmSource }),
        ...(input.initialUtmCampaign && !existingUser?.utmCampaign && { utmCampaign: input.initialUtmCampaign }),
        ...(input.initialUtmContent && !existingUser?.utmContent && { utmContent: input.initialUtmContent }),
      });

      if (existingUserByKeycloakIdentifier) {
        // Update last seen timestamp if already exists
        await db.update(userTable, {
          id: existingUserByKeycloakIdentifier.id,
          // Don't clobber a name the user set themselves; only backfill an empty one
          ...(name && !existingUserByKeycloakIdentifier.name && { name }),
          lastSeenAt: new Date().toISOString(),
        });
      } else if (existingUserByEmail) {
        // If `existingUserByEmail` exists but not `existingUserByKeycloakIdentifier`, that
        // means the user has been created by an Airtable automation, but hasn't logged in yet.
        // Adopt the existing user row in this case (by setting `keycloakIdentifier` for next time).
        const isFirstLogin = !existingUserByEmail.keycloakIdentifier;
        await db.update(userTable, {
          id: existingUserByEmail.id,
          ...(sub && { keycloakIdentifier: sub }),
          // Don't clobber a name the user set themselves; only backfill an empty one
          ...(name && !existingUserByEmail.name && { name }),
          lastSeenAt: new Date().toISOString(),
          firstLoggedInAt: new Date().toISOString(),
          ...(isFirstLogin && getInitialUtmFields(existingUserByEmail)),
        });
      } else {
        // Create user if doesn't exist
        await db.insert(userTable, {
          email: auth.email,
          ...(sub && { keycloakIdentifier: sub }),
          ...(name && { name }),
          lastSeenAt: new Date().toISOString(),
          firstLoggedInAt: new Date().toISOString(),
          ...getInitialUtmFields(),
        });
      }

      return {
        isNewUser: !existingUserByEmail && !existingUserByKeycloakIdentifier,
      };
    }),

  updateName: protectedProcedure
    .input(updateNameSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getUserFromAuthOrThrow(ctx.auth);
      return db.update(userTable, {
        id: user.id,
        name: input.name,
      });
    }),

  requestEmailChange: adminProcedure
    .input(z.object({
      userId: z.string().min(1),
      newEmail: newEmailSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.getFirst(userTable, { filter: { id: input.userId } });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      await sendEmailChangeConfirmation(user, input.newEmail);

      logger.info(`[EmailChange] admin ${impersonationRealIdentity(ctx).sub} requested email change for user ${user.id}: ${user.email} -> ${input.newEmail}`);

      return { sentTo: input.newEmail };
    }),

  requestOwnEmailChange: protectedProcedure
    .input(z.object({ newEmail: newEmailSchema }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.impersonation) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot change email when impersonating another user' });
      }

      const user = await getUserFromAuthOrThrow(ctx.auth);

      assertWithinEmailChangeRateLimit(user.id);

      try {
        await sendEmailChangeConfirmation(user, input.newEmail);
        recordEmailChangeAttempt(user.id);
      } catch (error) {
        if (error instanceof TRPCError) {
          recordEmailChangeAttempt(user.id);
        }

        throw error;
      }

      sendEmailChangeRequestedNotice({ oldEmail: user.email, newEmail: input.newEmail })
        .catch((error: unknown) => slackAlert(env, [`[EmailChange] courtesy notice to the old email failed for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`]));

      logger.info(`[EmailChange] user ${user.id} requested their own email change: ${user.email} -> ${input.newEmail}`);

      return { sentTo: input.newEmail };
    }),

  confirmEmailChange: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const payload = await verifyEmailChangeToken(input.token);

      const user = await db.getFirst(userTable, { filter: { id: payload.userId } });
      if (!user?.keycloakIdentifier) {
        throw linkNoLongerValid();
      }

      const currentEmail = normaliseEmail(user.email);

      // Already applied: a second click reports success without re-running anything.
      if (currentEmail === payload.newEmail) {
        return { newEmail: payload.newEmail, loginMethods: null };
      }

      if (currentEmail !== payload.oldEmail) {
        throw linkNoLongerValid();
      }

      if (await isEmailTaken(payload.newEmail, user.id, user.keycloakIdentifier)) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Another account already has this email' });
      }

      try {
        await updateKeycloakEmail(user.keycloakIdentifier, payload.newEmail);
      } catch (error) {
        logger.error(`[EmailChange] Keycloak update failed for user ${user.id}`, error);
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'We could not update your email right now. Please try again later.', cause: error });
      }

      try {
        await db.update(userTable, { id: user.id, email: payload.newEmail });
      } catch (error) {
        await slackAlert(env, [`[EmailChange] Keycloak now has ${payload.newEmail} for user ${user.id} but the user table update failed and still has ${payload.oldEmail}: ${error instanceof Error ? error.message : String(error)}`]);
        throw error;
      }

      logger.info(`[EmailChange] confirmed for user ${user.id}: ${payload.oldEmail} -> ${payload.newEmail}`);

      updateCustomerIoEmail({ userId: user.id, oldEmail: user.email, newEmail: payload.newEmail })
        .catch((error: unknown) => slackAlert(env, [`[EmailChange] customer.io rename failed for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`]));

      propagateEmailToCourseRegistrations(user.id, payload.newEmail)
        .catch((error: unknown) => slackAlert(env, [`[EmailChange] course registration email propagation failed for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`]));

      return { newEmail: payload.newEmail, ...await unlinkStaleGoogleIdentitiesOrAlert(user.id, user.keycloakIdentifier, payload.newEmail) };
    }),
});
