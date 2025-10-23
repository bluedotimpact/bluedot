import { userTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { updateKeycloakPassword, verifyKeycloakPassword } from '../../lib/api/keycloak';
import { changePasswordSchema } from '../../lib/schemas/user/changePassword.schema';
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

  updateName: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .trim()
          .min(1, 'Name is required')
          // 50 characters for a name seemed reasonable
          .max(50, 'Name must be under 50 characters'),
      }),
    )
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
