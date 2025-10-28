import { userTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import db from '../../lib/api/db';
import { updateKeycloakPassword, verifyKeycloakPassword } from '../../lib/api/keycloak';
import { changePasswordSchema } from '../../lib/schemas/user/changePassword.schema';
import { updateNameSchema } from '../../lib/schemas/user/me.schema';
import { protectedProcedure, router } from '../trpc';

export const usersRouter = router({
  getUser: protectedProcedure
    .query(async ({ ctx }) => {
      const existingUser = await db.getFirst(userTable, {
        filter: { email: ctx.auth.email },
      });
      if (!existingUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Update lastSeenAt timestamp
      return db.update(userTable, {
        id: existingUser.id,
        lastSeenAt: new Date().toISOString(),
      });
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

  updateName: protectedProcedure
    .input(updateNameSchema)
    .mutation(async ({ ctx, input }) => {
      const existingUser = await db.getFirst(userTable, {
        filter: { email: ctx.auth.email },
      });

      if (!existingUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      return db.update(userTable, {
        id: existingUser.id,
        name: input.name,
      });
    }),
});
