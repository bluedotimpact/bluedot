import { userTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import db from '../../lib/api/db';
import { updateKeycloakPassword, verifyKeycloakPassword } from '../../lib/api/keycloak';
import { changePasswordSchema } from '../../lib/schemas/user/changePassword.schema';
import { meRequestBodySchema } from '../../lib/schemas/user/me.schema';
import { protectedProcedure, router } from '../trpc';

export const usersRouter = router({
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
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

  ensureExists: protectedProcedure
    .input(meRequestBodySchema)
    .mutation(async ({ input, ctx }) => {
      const existingUser = await db.getFirst(userTable, {
        filter: { email: ctx.auth.email },
      });

      if (existingUser) {
        // Update last seen timestamp if already exists
        await db.update(userTable, {
          id: existingUser.id,
          lastSeenAt: new Date().toISOString(),
        });
      } else {
        // Create user if doesn't exist
        await db.insert(userTable, {
          email: ctx.auth.email,
          lastSeenAt: new Date().toISOString(),
          ...(input?.initialUtmSource && { utmSource: input.initialUtmSource }),
          ...(input?.initialUtmCampaign && { utmCampaign: input.initialUtmCampaign }),
          ...(input?.initialUtmContent && { utmContent: input.initialUtmCampaign }),
        });
      }
      return {
        isNewUser: !existingUser,
      };
    }),
});
