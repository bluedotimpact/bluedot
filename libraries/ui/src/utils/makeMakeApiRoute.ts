import createHttpError from 'http-errors';
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { z, ZodType } from 'zod';
import { slackAlert } from './slackAlert';

export type RouteOptions<ReqZT extends ZodType, ResZT extends ZodType, RequiresAuth extends boolean> = {
  /** The shape of the request body. @default ZodLiteral<null> */
  requestBody?: ReqZT,

  /** The form fo the response body. @default ZodLiteral<null> */
  responseBody?: ResZT,

  /** Whether to require a valid JWT token in the request. If true, will pass user details to the handler. @default true */
  requireAuth?: RequiresAuth,
};

type BaseAuthResult = { sub: string, email: string };

export type Handler<ReqZT extends ZodType, ResZT extends ZodType, RequiresAuth extends boolean, AuthResult extends BaseAuthResult> = (
  body: z.infer<ReqZT>,
  extra: {
    auth: RequiresAuth extends true ? AuthResult : null,
    raw: { req: NextApiRequest, res: NextApiResponse<z.infer<ResZT>> }
  },
) => Promise<z.infer<ResZT>>;

export type MakeMakeApiRouteEnv = {
  APP_NAME: string;
  ALERTS_SLACK_BOT_TOKEN: string;
  ALERTS_SLACK_CHANNEL_ID: string;
};

const EmptyBodySchema = z.union([z.object({}).strict(), z.literal(null), z.literal('')]).transform(() => null);

export const makeMakeApiRoute = <AuthResult extends BaseAuthResult>({ env, verifyAndDecodeToken }: {
  env: MakeMakeApiRouteEnv,
  verifyAndDecodeToken?: (bearerToken: string) => AuthResult | Promise<AuthResult>,
}) => <ReqZT extends ZodType, ResZT extends ZodType, RequiresAuth extends boolean>(
    opts: RouteOptions<ReqZT, ResZT, RequiresAuth>,
    handler: Handler<ReqZT, ResZT, RequiresAuth, AuthResult>,
  ): NextApiHandler => async (
      req,
      res,
    ) => {
      try {
        if (opts.requestBody?.isOptional()) {
          opts.requestBody = z.union([opts.requestBody, EmptyBodySchema]) as ZodType as ReqZT;
        }

        const optsFull: Required<RouteOptions<ReqZT, ResZT, RequiresAuth>> = {
          requestBody: EmptyBodySchema as ZodType as ReqZT,
          responseBody: z.literal(undefined) as ZodType as ResZT,
          requireAuth: true as RequiresAuth,
          ...opts,
        };

        const auth = await getAuth(req, optsFull.requireAuth, verifyAndDecodeToken);

        const requestParseResult = optsFull.requestBody.safeParse(req.body);
        if (!requestParseResult.success) {
          throw new createHttpError.BadRequest(`Invalid request body: ${requestParseResult.error.message}`);
        }

        const responseData = await handler(requestParseResult.data as z.infer<ReqZT>, {
          auth,
          raw: { req, res },
        });

        const responseParseResult = optsFull.responseBody.safeParse(responseData);
        if (!responseParseResult.success) {
          throw new createHttpError.InternalServerError('Invalid response body');
        }

        if (responseParseResult.data === null) {
          res.status(204).end();
        } else {
          res.status(200).json(responseParseResult.data);
        }
      } catch (err: unknown) {
        if (createHttpError.isHttpError(err) && err.expose) {
          console.warn(`Error handling request on route ${req.method} ${req.url}:`);
          console.warn(err);
          res.status(err.statusCode).json({ error: err.message });
          return;
        }

        console.error(`Internal error handling request on route ${req.method} ${req.url}:`);
        console.error(err);
        try {
          await slackAlert(env, [
            `Error: Failed request on route ${req.method} ${req.url}: ${err instanceof Error ? err.message : String(err)}`,
            ...(err instanceof Error ? [`Stack:\n\`\`\`${err.stack}\`\`\``] : []),
          ]);
        } catch (slackError) {
          console.error('Failed to send Slack', slackError);
        }
        res.status(createHttpError.isHttpError(err) ? err.statusCode : 500).json({
          error: 'Internal Server Error',
        });
      }
    };

const getAuth = async <RequiresAuth extends boolean, AuthResult extends BaseAuthResult>(
  req: NextApiRequest,
  requireAuth: RequiresAuth,
  verifyAndDecodeToken: undefined | ((bearerToken: string) => AuthResult | Promise<AuthResult>),
): Promise<RequiresAuth extends true ? AuthResult : null> => {
  if (requireAuth !== true) {
    return null as RequiresAuth extends true ? AuthResult : null;
  }

  const token = req.headers.authorization?.slice('Bearer '.length).trim();
  if (!token) {
    throw new createHttpError.Unauthorized('Missing token');
  }

  if (!verifyAndDecodeToken) {
    throw new createHttpError.InternalServerError('No verifyAndDecodeToken function provided to makeMakeApiRoute, so authenticated endpoints are not supported');
  }

  try {
    return await verifyAndDecodeToken(token) as RequiresAuth extends true ? AuthResult : null;
  } catch (err) {
    throw new createHttpError.Unauthorized('Invalid token');
  }
};
