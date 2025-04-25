import { loginPresets, makeMakeApiRoute } from '@bluedot/ui';
import env from './env';

export const makeApiRoute = makeMakeApiRoute({
  env,
  verifyAndDecodeToken: loginPresets.keycloak.verifyAndDecodeToken,
});
