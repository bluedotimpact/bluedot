import createHttpError from 'http-errors';
import { type NextApiHandler, type NextApiRequest, type NextApiResponse } from 'next';
import { z, type ZodType } from 'zod';
import {
  trace, metrics,
  SpanStatusCode,
} from '@opentelemetry/api';
import { slackAlert } from '@bluedot/utils';
import { logger } from './logger';

export type RouteOptions<ReqZT extends ZodType, ResZT extends ZodType, RequiresAuth extends boolean> = {
  /** The shape of the request body. @default ZodLiteral<null> */
  requestBody?: ReqZT;

  /** The form fo the response body. @default ZodLiteral<null> */
  responseBody?: ResZT;

  /** Whether to require a valid JWT token in the request. If true, will pass user details to the handler. @default true */
  requireAuth?: RequiresAuth;
};

type BaseAuthResult = { sub: string; email: string };

export type Handler<ReqZT extends ZodType, ResZT extends ZodType, RequiresAuth extends boolean, AuthResult extends BaseAuthResult> = (
  body: z.infer<ReqZT>,
  extra: {
    auth: RequiresAuth extends true ? AuthResult : null;
    raw: { req: NextApiRequest; res: NextApiResponse<z.infer<ResZT>> };
  },
) => Promise<z.infer<ResZT>>;

export type MakeMakeApiRouteEnv = {
  APP_NAME: string;
  ALERTS_SLACK_BOT_TOKEN: string;
  ALERTS_SLACK_CHANNEL_ID: string;
  INFO_SLACK_CHANNEL_ID: string;
};

const EmptyBodySchema = z.union([z.object({}).strict(), z.literal(null), z.literal(undefined), z.literal('')]).transform(() => null as null | undefined | void);

const streamingPlaceholder = Symbol('streamingPlaceholder');
export const StreamingResponseSchema = EmptyBodySchema.transform(() => streamingPlaceholder as unknown as null | undefined | void);

// Use the meter for API request metrics
const meter = metrics.getMeter('api-routes');
export const requestCounter = meter.createCounter('api_requests_total', {
  description: 'Total number of API requests',
});

export const makeMakeApiRoute = <AuthResult extends BaseAuthResult>({ env, verifyAndDecodeToken }: {
  env: MakeMakeApiRouteEnv;
  verifyAndDecodeToken?: (bearerToken: string) => AuthResult | Promise<AuthResult>;
}) => <ReqZT extends ZodType = typeof EmptyBodySchema, ResZT extends ZodType = typeof EmptyBodySchema, RequiresAuth extends boolean = true>(
  opts: RouteOptions<ReqZT, ResZT, RequiresAuth>,
  handler: Handler<ReqZT, ResZT, RequiresAuth, AuthResult>,
): NextApiHandler => async (
  req,
  res,
) => {
  // Extract method and path for instrumentation
  const method = req.method || 'UNKNOWN';
  const path = req.url || 'UNKNOWN';
  const userAgent = req.headers['user-agent'] ?? 'unknown';

  // Get the current active span
  const activeSpan = trace.getActiveSpan();
  activeSpan?.setAttribute('http.method', method);
  activeSpan?.setAttribute('http.url', path);
  activeSpan?.setAttribute('user.agent', userAgent);

  let statusCode = 200;

  try {
    const optsFull: Required<RouteOptions<ReqZT, ResZT, RequiresAuth>> = {
      requireAuth: opts.requireAuth ?? true as RequiresAuth,
      responseBody: (opts.responseBody?.isOptional() ? z.union([opts.responseBody, EmptyBodySchema]) : opts.responseBody ?? EmptyBodySchema) as ZodType as ResZT,
      requestBody: (opts.requestBody?.isOptional() ? z.union([opts.requestBody, EmptyBodySchema]) : opts.requestBody ?? EmptyBodySchema) as ZodType as ReqZT,
    };

    const auth = await getAuth(req, optsFull.requireAuth, verifyAndDecodeToken);
    activeSpan?.setAttribute('user.email', auth?.email ?? 'anonymous');

    const requestParseResult = optsFull.requestBody.safeParse(req.body);
    if (!requestParseResult.success) {
      throw new createHttpError.BadRequest(`Invalid request body: ${requestParseResult.error.message}`);
    }

    const responseData = await handler(requestParseResult.data as z.infer<ReqZT>, {
      auth,
      raw: { req, res },
    }).catch((err: unknown) => {
      if (err instanceof Error && err.name === 'AirtableTsError' && (err as Error & { type: string }).type === 'RESOURCE_NOT_FOUND') {
        throw new createHttpError.NotFound('Resource not found');
      }

      throw err;
    });

    const responseParseResult = optsFull.responseBody.safeParse(responseData);
    if (!responseParseResult.success) {
      throw new createHttpError.InternalServerError('Invalid response body');
    }

    if (responseParseResult.data === streamingPlaceholder) {
      // noop, handler should deal with streaming response to client
      // We can't know the status code here, so we'll use 200 as default
    } else if (responseParseResult.data === null) {
      statusCode = 204;
      res.status(204).end();
    } else {
      statusCode = 200;
      res.status(200).json(responseParseResult.data);
    }

    activeSpan?.setAttribute('http.status_code', statusCode);
    activeSpan?.setStatus({ code: SpanStatusCode.OK });
    requestCounter.add(1, {
      method,
      path,
      status_code: statusCode.toString(),
      user_agent: userAgent,
    });
  } catch (err: unknown) {
    if (createHttpError.isHttpError(err) && err.expose) {
      statusCode = err.statusCode;

      activeSpan?.setAttribute('http.status_code', err.statusCode);
      activeSpan?.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      requestCounter.add(1, {
        method,
        path,
        status_code: err.statusCode.toString(),
        user_agent: userAgent,
      });

      logger.warn('Client error handling request:', err);

      res.status(err.statusCode).json({ error: err.message });

      return;
    }

    statusCode = createHttpError.isHttpError(err) ? err.statusCode : 500;

    activeSpan?.setAttribute('http.status_code', statusCode);
    activeSpan?.setStatus({ code: SpanStatusCode.ERROR, message: err instanceof Error ? err.message : String(err) });
    requestCounter.add(1, {
      method,
      path,
      status_code: statusCode.toString(),
      user_agent: userAgent,
    });

    logger.error('Internal error handling request:', err);
    slackAlert(env, [
      `Error: Failed request on route ${req.method} ${req.url}: ${err instanceof Error ? err.message : String(err)}`,
      ...(err instanceof Error ? [`Stack:\n\`\`\`${err.stack}\`\`\``] : []),
    ]);

    res.status(statusCode).json({
      error: 'Internal Server Error',
    });
  }
};

const getAuth = async <RequiresAuth extends boolean, AuthResult extends BaseAuthResult>(
  req: NextApiRequest,
  requireAuth: RequiresAuth,
  verifyAndDecodeToken: undefined | ((bearerToken: string) => AuthResult | Promise<AuthResult>),
): Promise<RequiresAuth extends true ? AuthResult : null> => {
  if (!requireAuth) {
    return null as RequiresAuth extends true ? AuthResult : null;
  }

  const token = req.headers.authorization?.slice('Bearer '.length).trim();
  if (!token) {
    throw new createHttpError.Unauthorized('Missing access token');
  }

  if (!verifyAndDecodeToken) {
    throw new createHttpError.InternalServerError('No verifyAndDecodeToken function provided to makeMakeApiRoute, so authenticated endpoints are not supported');
  }

  try {
    return await verifyAndDecodeToken(token) as RequiresAuth extends true ? AuthResult : null;
  } catch (err) {
    logger.error('Error verifying token', err);
    throw new createHttpError.Unauthorized('Invalid access token');
  }
};
