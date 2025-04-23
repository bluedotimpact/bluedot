import { loginPresets, LoginRedirectPage } from '@bluedot/ui';

export default () => <LoginRedirectPage oidcSettings={loginPresets.googleBlueDot.oidcSettings} />;
