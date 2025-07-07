import { z } from 'zod';
import createHttpError from 'http-errors';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import {
  verifyKeycloakPassword,
  updateKeycloakPassword,
} from '../../../../lib/api/keycloak';
import { changePasswordSchema } from '../../../../lib/schemas/user/changePassword.schema';

// Response schema
const changePasswordResponseSchema = z.object({
  type: z.literal('success'),
  message: z.string(),
});

export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type ChangePasswordResponse = z.infer<
  typeof changePasswordResponseSchema
>;

/**
 * Note: Due to JWT-based authentication, existing sessions/tokens remain valid
 * until they expire naturally. This is a limitation of stateless authentication.
 */
export default makeApiRoute(
  {
    requireAuth: true,
    requestBody: changePasswordSchema,
    responseBody: changePasswordResponseSchema,
  },
  async (body, { auth }) => {
    const { currentPassword, newPassword } = body;
    const userEmail = auth.email;
    const userSub = auth.sub;

    // Step 1: Verify current password with Keycloak
    const isPasswordValid = await verifyKeycloakPassword(
      userEmail,
      currentPassword,
    );
    if (!isPasswordValid) {
      throw new createHttpError.Unauthorized('Incorrect password');
    }

    // Step 2: Update password in Keycloak
    await updateKeycloakPassword(userSub, newPassword);

    return {
      type: 'success' as const,
      message: 'Password updated successfully',
    };
  },
);
