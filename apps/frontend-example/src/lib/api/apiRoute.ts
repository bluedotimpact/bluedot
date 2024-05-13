import createHttpError from 'http-errors';
import { NextApiHandler } from 'next';
import { slackAlert } from './slackAlert';

export const apiRoute = (handler: NextApiHandler, useAuth: true | 'insecure_no_auth' = true): NextApiHandler => async (req, res) => {
  try {
    if (useAuth !== 'insecure_no_auth') {
      const token = req.headers.authorization?.slice('Bearer '.length).trim();
      if (!token) {
        throw new createHttpError.Unauthorized('Missing token');
      }
      throw new Error('Authenticated endpoints not supported');
    }
    await handler(req, res);
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
      await slackAlert([
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
