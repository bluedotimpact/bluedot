import {
  adminUsersTable, AirtableTsError, eq, ErrorType,
} from '@bluedot/db';
import { requestCounter } from '@bluedot/ui/src/utils/makeMakeApiRoute';
import { initTRPC, TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
// eslint-disable-next-line import/no-extraneous-dependencies
import { SpanStatusCode, trace } from '@opentelemetry/api';
import db from '../lib/api/db';
import env from '../lib/api/env';
import { Context } from './context';

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
  if (type === 'query') method = 'GET';
  else if (type === 'mutation') method = 'POST';

  const activeSpan = trace.getActiveSpan();
  activeSpan?.setAttribute('http.method', method);
  activeSpan?.setAttribute('http.url', path);
  activeSpan?.setAttribute('user.email', ctx.auth?.email ?? 'anonymous');

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
    });

    throw finalError;
  }
});

const checkAdminAccess = async (email: string) => {
  try {
    const admin = await db.pg.select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.email, email))
      .limit(1);

    return admin.length > 0;
  } catch {
    return false;
  }
};

/* Override `undefined` responses as `null` so that React query does not reject as a failed Promise, leading to
`isError` being true on queries/mutations. */
const overrideUndefinedResponse = t.middleware(async (opts) => {
  const result = await opts.next();
  if (result.ok && result.data === undefined) {
    result.data = null;
    slackAlert(env, [`tRPC procedure at path "${opts.path}" returned undefined response. Converted to null.`]);
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
  const hasAdminAccess = await checkAdminAccess(ctx.auth.email);
  if (!hasAdminAccess) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized' });
  }
  return next({ ctx });
});
