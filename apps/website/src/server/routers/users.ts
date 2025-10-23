import { TRPCError } from '@trpc/server';
import { userTable } from '@bluedot/db';
import { updateKeycloakPassword, verifyKeycloakPassword } from '../../lib/api/keycloak';
import { changePasswordSchema } from '../../lib/schemas/user/changePassword.schema';
import { protectedProcedure, router } from '../trpc';
import db from '../../lib/api/db';

export const usersRouter = router({
  getUser: protectedProcedure
    .query(async ({ ctx }) => {
      const existingUser = await db.getFirst(userTable, {
        filter: { email: ctx.auth.email },
      });
      if (existingUser) {
        // Update lastSeenAt timestamp
        return db.update(userTable, {
          id: existingUser.id,
          lastSeenAt: new Date().toISOString(),
        });
      }
      return existingUser;
    }),

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
});
