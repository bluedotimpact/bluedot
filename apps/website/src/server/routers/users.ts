import { userTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import db from '../../lib/api/db';
import { updateKeycloakPassword, verifyKeycloakPassword } from '../../lib/api/keycloak';
import { changePasswordSchema } from '../../lib/schemas/user/changePassword.schema';
import { createUserSchema, updateNameSchema } from '../../lib/schemas/user/me.schema';
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

  ensureExists: protectedProcedure
    .input(createUserSchema)
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
          ...(input?.initialUtmContent && { utmContent: input.initialUtmContent }),
        });
      }

      return {
        isNewUser: !existingUser,
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
