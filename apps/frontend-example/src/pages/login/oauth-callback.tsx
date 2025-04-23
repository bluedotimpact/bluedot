import { LoginOauthCallbackPage, loginPresets } from '@bluedot/ui';

export default () => <LoginOauthCallbackPage userManagerSettings={loginPresets.keycloak.oidcSettings} />;
