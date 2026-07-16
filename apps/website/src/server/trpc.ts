import {
  AirtableTsError, ErrorType, userTable,
} from '@bluedot/db';
import { requestCounter } from '@bluedot/ui/src/utils/makeMakeApiRoute';
import { initTRPC, TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
// eslint-disable-next-line import/no-extraneous-dependencies
import { SpanStatusCode, trace } from '@opentelemetry/api';
import db from '../lib/api/db';
import env from '../lib/api/env';
import type { AuthContext, Context } from './context';

// Avoid exporting the entire t-object since it's not very descriptive.
// For instance, the use of a t variable is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    // Hide internal server error details in production
    if (error.code === 'INTERNAL_SERVER_ERROR' && process.env.NODE_ENV === 'production') {
      return {
        ...shape,
        message: 'An internal server error occurred',
        data: {
          ...shape.data,
          stack: undefined,
        },
      };
    }

    // Mask not found errors to hide any specific resource information in production
    if (error.code === 'NOT_FOUND' && process.env.NODE_ENV === 'production') {
      return {
        ...shape,
        message: 'Resource not found',
        data: {
          ...shape.data,
          stack: undefined,
        },
      };
    }

    return shape;
  },
});

const openTelemetryMiddleware = t.middleware(async (opts) => {
  const { type, path, ctx } = opts;

  let method = 'UNKNOWN';
  if (type === 'query') {
    method = 'GET';
  } else if (type === 'mutation') {
    method = 'POST';
  }

  const userAgent = ctx.userAgent ?? 'unknown';

  const activeSpan = trace.getActiveSpan();
  activeSpan?.setAttribute('http.method', method);
  activeSpan?.setAttribute('http.url', path);
  activeSpan?.setAttribute('user.email', ctx.auth?.email ?? 'anonymous');
  activeSpan?.setAttribute('user.agent', userAgent);

  let statusCode = 200;

  try {
    const result = await opts.next();

    // Set span attributes for success
    activeSpan?.setAttribute('http.status_code', statusCode);
    activeSpan?.setStatus({ code: SpanStatusCode.OK });
    requestCounter.add(1, {
      method,
      path,
      status_code: statusCode.toString(),
      user_agent: userAgent,
    });

    return result;
  } catch (error) {
    let finalError = error;
    if (error instanceof AirtableTsError && error.type === ErrorType.RESOURCE_NOT_FOUND) {
      finalError = new TRPCError({
        code: 'NOT_FOUND',
        message: error.message,
        cause: error,
      });
    }

    if (finalError instanceof TRPCError) {
      statusCode = getHTTPStatusCodeFromError(finalError);
    } else {
      // Fallback to 500
      statusCode = 500;
    }

    // Set span attributes for error
    activeSpan?.setAttribute('http.status_code', statusCode);
    activeSpan?.setStatus({
      code: SpanStatusCode.ERROR,
      message: finalError instanceof Error ? finalError.message : String(finalError),
    });
    requestCounter.add(1, {
      method,
      path,
      status_code: statusCode.toString(),
      user_agent: userAgent,
    });

    throw finalError;
  }
});

export const getUserFromAuth = async (auth: Pick<AuthContext, 'sub'>) => {
  if (!auth.sub) return null;
  return db.getFirst(userTable, { filter: { keycloakIdentifier: auth.sub } });
};

export const getUserFromAuthOrThrow = async (auth: Pick<AuthContext, 'sub'>) => {
  const user = await getUserFromAuth(auth);
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No user record for this account. Please log in again.' });
  }

  return user;
};

// The real actor behind the request: the admin during impersonation, otherwise the caller.
export const impersonationRealIdentity = (ctx: {
  auth: { sub: string } | null;
  impersonation?: { adminSub: string } | null;
}): Pick<AuthContext, 'sub'> => ({ sub: ctx.impersonation?.adminSub ?? ctx.auth?.sub ?? '' });

export const checkAdminAccess = async (auth: Pick<AuthContext, 'sub'>): Promise<boolean> => {
  const user = await getUserFromAuth(auth);

  return user?.isAdmin === true;
};

export type ImpersonationAccess = 'admin' | 'scoped' | 'none';

export const checkImpersonationAccess = async (auth: Pick<AuthContext, 'sub'>): Promise<{ access: ImpersonationAccess; allowedTargets: string[] }> => {
  const user = await getUserFromAuth(auth);
  if (user?.isAdmin) return { access: 'admin', allowedTargets: [] };
  if (user?.allowedImpersonationTargets?.length) return { access: 'scoped', allowedTargets: user.allowedImpersonationTargets };
  return { access: 'none', allowedTargets: [] };
};

/* Override `undefined` responses as `null` so that React query does not reject as a failed Promise, leading to
`isError` being true on queries/mutations. */
const overrideUndefinedResponse = t.middleware(async (opts) => {
  const result = await opts.next();
  if (result.ok && result.data === undefined) {
    result.data = null;
    slackAlert(env, [`tRPC procedure at path "${opts.path}" returned undefined response. Converted to null.`], { batchKey: 'trpc-undefined-responses' });
  }

  return result;
});

// Base router and procedure helpers
export const { router } = t;
export const publicProcedure = t.procedure.use(openTelemetryMiddleware).use(overrideUndefinedResponse);
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.auth) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  return next({ ctx });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // During impersonation, check the real user's permissions, not the impersonated user's.
  // This prevents privilege escalation when a scoped user impersonates an admin.
  const hasAdminAccess = await checkAdminAccess(impersonationRealIdentity(ctx));
  if (!hasAdminAccess) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized' });
  }

  return next({ ctx });
});
