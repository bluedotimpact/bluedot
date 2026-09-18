import { loginPresets } from '@bluedot/ui';
import { makeMakeApiRoute } from '@bluedot/ui/src/api';
import env from './env';
import { isLocalPreview, PREVIEW_EMAIL, PREVIEW_TOKEN } from '../preview';

export const verifyStaffToken = async (token: string) => {
  if (isLocalPreview() && token === PREVIEW_TOKEN) return { sub: 'local-preview', email: PREVIEW_EMAIL };
  return loginPresets.googleBlueDot.verifyAndDecodeToken(token);
};

const staffApiRoute = makeMakeApiRoute({ env, verifyAndDecodeToken: verifyStaffToken });

export const makeApiRoute: typeof staffApiRoute = (options, handler) => {
  const route = staffApiRoute(options, handler);
  const method = options.requestBody ? 'POST' : 'GET';
  return (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== method) {
      res.setHeader('Allow', method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    return route(req, res);
  };
};
