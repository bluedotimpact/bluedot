import { makeMakeApiRoute, verifyKeycloakToken } from '@bluedot/ui/src/api';
import env from './env';

export const makeApiRoute = makeMakeApiRoute({
  env,
  verifyAndDecodeToken: verifyKeycloakToken,
});
