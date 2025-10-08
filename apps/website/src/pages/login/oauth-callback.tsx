import { LoginOauthCallbackPage, loginPresets } from '@bluedot/ui';
import axios from 'axios';
import { GetUserResponse } from '../api/users/me';

export default () => (
  <LoginOauthCallbackPage
    loginPreset={loginPresets.keycloak}
    onLoginComplete={async (auth, redirectTo) => {
      // Extract UTM params from the redirectTo URL
      const redirectUrl = new URL(redirectTo, window.location.origin);
      const utmSource = redirectUrl.searchParams.get('utm_source');
      const utmCampaign = redirectUrl.searchParams.get('utm_campaign');
      const utmContent = redirectUrl.searchParams.get('utm_content');

      // Build query string for /api/users/me
      const utmParams = new URLSearchParams();
      if (utmSource) utmParams.set('utmSource', utmSource);
      if (utmCampaign) utmParams.set('utmCampaign', utmCampaign);
      if (utmContent) utmParams.set('utmContent', utmContent);

      const queryString = utmParams.toString();
      const url = `/api/users/me${queryString ? `?${queryString}` : ''}`;

      const response = await axios.get<GetUserResponse>(url, {
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
