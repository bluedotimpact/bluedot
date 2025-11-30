import { userTable } from '@bluedot/db';
import { loginPresets } from '@bluedot/ui';
import { logger } from '@bluedot/ui/src/api';
import * as trpcNext from '@trpc/server/adapters/next';
import db from '../lib/api/db';
import { checkAdminAccess } from './trpc';

export const createContext = async ({ req }: trpcNext.CreateNextContextOptions) => {
  const authHeader = req.headers.authorization;

  // Only attempt to verify if we have a valid Bearer token format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { auth: null, impersonation: null };
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const auth = await loginPresets.keycloak.verifyAndDecodeToken(token);

    // User impersonation spec:
    // - id of user to impersonate is stored client-side in sessionStorage. Using sessionStorage means the impersonation is cleared when the tab is closed.
    // - id is sent via x-impersonate-user header on each request
    // - Server validates: 1. The requester is admin, 2. The target user exists
    // - Audit: impersonation events are logged with both admin and target emails so we can see when this is used in prod
    const impersonateUserId = req.headers['x-impersonate-user'] as string | undefined;
    if (impersonateUserId && await checkAdminAccess(auth.email)) {
      const targetUser = await db.getFirst(userTable, { filter: { id: impersonateUserId } });
      if (targetUser) {
        logger.info(`Admin ${auth.email} impersonating user ${targetUser.email}`);
        return {
          auth: { ...auth, email: targetUser.email },
          impersonation: { adminEmail: auth.email, targetEmail: targetUser.email },
        };
      }
    }

    return { auth, impersonation: null };
  } catch (error) {
    // Token verification failed - return null and let protectedProcedure handle it
    logger.error('Error verifying token', error);
    return { auth: null, impersonation: null };
  }
};

export type Context = Awaited<ReturnType<typeof createContext>>;
