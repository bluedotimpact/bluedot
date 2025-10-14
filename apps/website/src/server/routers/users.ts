import { TRPCError } from '@trpc/server';
import { updateKeycloakPassword, verifyKeycloakPassword } from '../../lib/api/keycloak';
import { protectedProcedure, router } from '../trpc';
import { changePasswordSchema } from '../../lib/schemas/user/changePassword.schema';

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
});
