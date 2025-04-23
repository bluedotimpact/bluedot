import { LoginOauthCallbackPage, loginPresets } from '@bluedot/ui';

export default () => <LoginOauthCallbackPage oidcSettings={loginPresets.googleBlueDot.oidcSettings} />;
