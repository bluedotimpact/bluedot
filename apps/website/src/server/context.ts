import { loginPresets } from '@bluedot/ui';
import { logger } from '@bluedot/ui/src/api';
import * as trpcNext from '@trpc/server/adapters/next';
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

    const impersonateEmail = req.headers['x-impersonate-user'] as string | undefined;
    if (impersonateEmail && await checkAdminAccess(auth.email)) {
      logger.info(`Admin ${auth.email} impersonating ${impersonateEmail}`);
      return {
        auth: { ...auth, email: impersonateEmail },
        impersonation: { adminEmail: auth.email, targetEmail: impersonateEmail },
      };
    }

    return { auth, impersonation: null };
  } catch (error) {
    // Token verification failed - return null and let protectedProcedure handle it
    logger.error('Error verifying token', error);
    return { auth: null, impersonation: null };
  }
};

export type Context = Awaited<ReturnType<typeof createContext>>;
