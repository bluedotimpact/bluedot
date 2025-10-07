import { loginPresets } from '@bluedot/ui';
import { TRPCError } from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';

export const createContext = async ({ req }: trpcNext.CreateNextContextOptions) => {
  const authHeader = req.headers.authorization;

  if (authHeader && !authHeader.startsWith('Bearer ')) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid authorization header' });
  }

  const token = authHeader?.slice('Bearer '.length).trim();

  let auth: { sub: string, email: string } | null = null;

  if (token) {
    try {
      auth = await loginPresets.keycloak.verifyAndDecodeToken(token);
    } catch (error) {
      // TODO: do we need this fallback check to googleBlueDot?
      // try {
      //   auth = await loginPresets.googleBlueDot.verifyAndDecodeToken(token);
      // } catch {
      // }
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid access token' });
    }
  }

  return { auth };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
