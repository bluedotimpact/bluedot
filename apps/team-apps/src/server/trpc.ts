import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { verifyStaffToken } from '../lib/api/makeApiRoute';
import { requestCandidateEngine } from './candidateEngine';

export type Context = {
  auth: { sub: string; email: string } | null;
  candidateEngine: typeof requestCandidateEngine;
};

export const createContext = async ({ req, res }: CreateNextContextOptions): Promise<Context> => {
  res.setHeader('Cache-Control', 'no-store');
  const header = req.headers.authorization;
  let auth: Context['auth'] = null;
  if (header?.startsWith('Bearer ')) {
    try {
      auth = await verifyStaffToken(header.slice(7));
    } catch { /* Rejected credentials are handled by the staff procedure. */ }
  }

  return { auth, candidateEngine: requestCandidateEngine };
};

const t = initTRPC.context<Context>().create();
export const { router } = t;
export const staffProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.auth) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign in with your BlueDot Google account to continue.' });
  return next({ ctx: { ...ctx, auth: ctx.auth } });
});
