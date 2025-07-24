import { LoginOauthCallbackPage, loginPresets } from '@bluedot/ui';
import axios from 'axios';
import { GetUserResponse } from '../api/users/me';

export default () => (
  <LoginOauthCallbackPage
    loginPreset={loginPresets.keycloak}
    onLoginComplete={async (auth) => {
      const response = await axios.get<GetUserResponse>('/api/users/me', {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'CompletedSignup',
          new_customer: response.data.isNewUser,
        });
      }
    }}
  />
);
