import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { verifyConnectTokenFromEnv } from '../../lib/api/calendarConnect';
import { disconnectConnection, listConnectionsForUser } from '../../lib/api/calendarConnections';
import { getUserFromAuthOrThrow, protectedProcedure, router } from '../trpc';

export const calendarConnectionsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserFromAuthOrThrow(ctx.auth);
    const connections = await listConnectionsForUser(user.id);
    return connections.map((connection) => ({
      id: connection.id,
      provider: connection.provider,
      email: connection.providerAccountEmail,
      connectedAt: connection.createdAt,
      needsReconnect: Boolean(connection.lastError),
    }));
  }),

  checkConnectLink: protectedProcedure
    .input(z.object({ token: z.string().max(2000) }))
    .query(({ input }) => ({ valid: verifyConnectTokenFromEnv(input.token) !== null })),

  disconnect: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.impersonation) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can\'t disconnect calendars while impersonating someone' });
      }

      const user = await getUserFromAuthOrThrow(ctx.auth);
      const deleted = await disconnectConnection({ userId: user.id, connectionId: input.id });
      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Calendar connection not found' });
      }

      return { ok: true };
    }),
});
