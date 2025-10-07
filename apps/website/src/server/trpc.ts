import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';

// Avoid exporting the entire t-object since it's not very descriptive.
// For instance, the use of a t variable is common in i18n libraries.
const t = initTRPC.context<Context>().create();

// Base router and procedure helpers
export const { router } = t;
export const { procedure: publicProcedure } = t;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.auth) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid access token' });
  }
  return next({ ctx: { ...ctx, auth: ctx.auth } });
});
