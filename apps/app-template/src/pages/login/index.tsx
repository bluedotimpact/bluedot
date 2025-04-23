import { loginPresets, LoginRedirectPage } from '@bluedot/ui';

export default () => <LoginRedirectPage userManagerSettings={loginPresets.keycloak.oidcSettings} />;
