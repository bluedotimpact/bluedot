import { userTable } from '@bluedot/db';
import { InvalidTokenError, loginPresets } from '@bluedot/ui/src/Login';
import { logger } from '@bluedot/ui/src/api';
import { TRPCError } from '@trpc/server';
import type * as trpcNext from '@trpc/server/adapters/next';
import db from '../lib/api/db';
import { checkImpersonationAccess } from './trpc';

export type AuthContext = Awaited<ReturnType<typeof loginPresets.keycloak.verifyAndDecodeToken>>;

export const createContext = async ({ req }: trpcNext.CreateNextContextOptions) => {
  const authHeader = req.headers.authorization;
  const userAgent = req.headers['user-agent'];

  // Only attempt to verify if we have a valid Bearer token format
  if (!authHeader?.startsWith('Bearer ')) {
    return { auth: null, impersonation: null, userAgent };
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const auth = await loginPresets.keycloak.verifyAndDecodeToken(token);

    // User impersonation spec:
    // - id of user to impersonate is stored client-side in sessionStorage. Using sessionStorage means the impersonation is cleared when the tab is closed.
    // - id is sent via x-impersonate-user header on each request
    // - Server validates: 1. The requester is admin or has scoped access, 2. The target user exists and is within allowed targets
    // - Audit: impersonation events are logged with both admin and target emails so we can see when this is used in prod
    const impersonateUserId = req.headers['x-impersonate-user'] as string | undefined;
    if (impersonateUserId) {
      const { access, allowedTargets } = await checkImpersonationAccess(auth);
      const canImpersonate = access === 'admin' || (access === 'scoped' && allowedTargets.includes(impersonateUserId));

      const targetUser = canImpersonate
        ? await db.getFirst(userTable, { filter: { id: impersonateUserId } })
        : null;
      if (targetUser) {
        // A target with no keycloakIdentifier has never logged in via Keycloak and so is not a
        // legitimate user to act as.
        if (!targetUser.keycloakIdentifier) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot impersonate a user who has never logged in' });
        }

        logger.info(`${auth.email} impersonating user ${targetUser.email} (access: ${access})`);
        return {
          auth: { ...auth, email: targetUser.email, sub: targetUser.keycloakIdentifier },
          impersonation: { adminEmail: auth.email, adminSub: auth.sub, targetEmail: targetUser.email },
          userAgent,
        };
      }
    }

    return { auth, impersonation: null, userAgent };
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      logger.warn('Rejected access token', error);
      return { auth: null, impersonation: null, userAgent };
    }

    // e.g. impersonation rejections (passed through as-is), or failing to reach the login service (becomes a 500)
    throw error;
  }
};

export type Context = Awaited<ReturnType<typeof createContext>>;
