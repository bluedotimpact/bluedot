import { userTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { loginPresets } from '@bluedot/ui/src/Login';
import z from 'zod';
import db from '../../lib/api/db';
import { updateKeycloakPassword, verifyKeycloakPassword } from '../../lib/api/keycloak';
import { changePasswordSchema } from '../../lib/schemas/user/changePassword.schema';
import { updateNameSchema } from '../../lib/schemas/user/me.schema';
import {
  getUserFromAuthOrThrow, protectedProcedure, publicProcedure, router,
} from '../trpc';

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
});
