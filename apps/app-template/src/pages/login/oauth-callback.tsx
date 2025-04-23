import { LoginOauthCallbackPage, loginPresets } from '@bluedot/ui';

export default () => <LoginOauthCallbackPage oidcSettings={loginPresets.keycloak.oidcSettings} />;
