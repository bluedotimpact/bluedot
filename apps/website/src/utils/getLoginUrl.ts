import { addQueryParam } from '@bluedot/ui';
import { ROUTES } from '../lib/routes';

export const getLoginUrl = (currentPath: string, shouldRegister = false) => {
  const baseUrl = shouldRegister ? ROUTES.join.url : ROUTES.login.url;
  return addQueryParam(baseUrl, 'redirect_to', currentPath);
};
