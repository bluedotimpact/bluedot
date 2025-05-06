import { loginPresets } from '@bluedot/ui';
import { makeMakeApiRoute } from '@bluedot/ui/src/api';
import env from './env';

export const makeApiRoute = makeMakeApiRoute({
  env,
  verifyAndDecodeToken: loginPresets.googleBlueDot.verifyAndDecodeToken,
});
