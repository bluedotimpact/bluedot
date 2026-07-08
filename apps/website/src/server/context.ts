import { userTable } from '@bluedot/db';
import { loginPresets } from '@bluedot/ui/src/Login';
import { logger } from '@bluedot/ui/src/api';
import { TRPCError } from '@trpc/server';
import type * as trpcNext from '@trpc/server/adapters/next';
import db from '../lib/api/db';
import { checkImpersonationAccess } from './trpc';

// The server-verified caller identity, decoded from the Keycloak bearer token. Sourced directly from
// the token verifier (not from `Context`) so permission helpers can reference it without a circular type.
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
        // legitimate user to act as. Block impersonation rather than downgrading to an empty sub
        // (downstream reads resolve callers by sub only, so an empty sub can never resolve).
        if (!targetUser.keycloakIdentifier) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Cannot impersonate a user who has never logged in' });
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
    // Deliberate rejections (e.g. impersonating an ineligible target) propagate as-is.
    if (error instanceof TRPCError) {
      throw error;
    }

    // Token verification failed - return null and let protectedProcedure handle it
    logger.error('Error verifying token', error);
    return { auth: null, impersonation: null, userAgent };
  }
};

export type Context = Awaited<ReturnType<typeof createContext>>;
