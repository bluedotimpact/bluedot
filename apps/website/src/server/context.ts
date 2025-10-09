import { loginPresets } from '@bluedot/ui';
import * as trpcNext from '@trpc/server/adapters/next';

export const createContext = async ({ req }: trpcNext.CreateNextContextOptions) => {
  const authHeader = req.headers.authorization;

  // Only attempt to verify if we have a valid Bearer token format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { auth: null };
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const auth = await loginPresets.keycloak.verifyAndDecodeToken(token);
    return { auth };
  } catch (error) {
    // TODO: do we need this fallback check to googleBlueDot?
    // try {
    //   auth = await loginPresets.googleBlueDot.verifyAndDecodeToken(token);
    // } catch {
    // }
    // Token verification failed - return null and let protectedProcedure handle it
    return { auth: null };
  }
};

export type Context = Awaited<ReturnType<typeof createContext>>;
