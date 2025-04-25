import { LoginOauthCallbackPage, loginPresets } from '@bluedot/ui';
import axios from 'axios';
import { GetUserResponse } from '../api/users/me';

export default () => (
  <LoginOauthCallbackPage
    oidcSettings={loginPresets.keycloak.oidcSettings}
    onLoginComplete={async (auth) => {
      // This ensures the user is created
      await axios.get<GetUserResponse>('/api/users/me', {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
    }}
  />
);
