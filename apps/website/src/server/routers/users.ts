import { userTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import db from '../../lib/api/db';
import { updateKeycloakPassword, verifyKeycloakPassword } from '../../lib/api/keycloak';
import { changePasswordSchema } from '../../lib/schemas/user/changePassword.schema';
import { trackUtmSchema, updateNameSchema } from '../../lib/schemas/user/me.schema';
import { protectedProcedure, router } from '../trpc';

export const usersRouter = router({
  getUser: protectedProcedure
    .query(async ({ ctx }) => {
      // Update lastSeenAt timestamp
      return db.update(userTable, {
        id: ctx.user.id,
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

  // Records initial UTM params on the user's row at login. The row itself is guaranteed to
  // exist by protectedProcedure; UTM fields are only ever written once, but that write can
  // happen on a later login if the row was created without them (e.g. by an Airtable automation).
  trackUtmOnLogin: protectedProcedure
    .input(trackUtmSchema)
    .mutation(async ({ input, ctx }) => {
      const { user, isNewUser } = ctx;

      const hasExistingUtm = [user.utmSource, user.utmCampaign, user.utmContent].some(Boolean);
      const utmFields = {
        ...(input?.initialUtmSource && { utmSource: input.initialUtmSource }),
        ...(input?.initialUtmCampaign && { utmCampaign: input.initialUtmCampaign }),
        ...(input?.initialUtmContent && { utmContent: input.initialUtmContent }),
      };

      if (!hasExistingUtm && Object.keys(utmFields).length > 0) {
        await db.update(userTable, { id: user.id, ...utmFields });
      }

      return { isNewUser };
    }),

  updateName: protectedProcedure
    .input(updateNameSchema)
    .mutation(async ({ ctx, input }) => {
      return db.update(userTable, {
        id: ctx.user.id,
        name: input.name,
      });
    }),
});
