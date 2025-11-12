import { LoginOauthCallbackPage, loginPresets } from '@bluedot/ui';
import { trpc } from '../../utils/trpc';

export default () => {
  const ensureUserExistsMutation = trpc.users.ensureExists.useMutation();

  return (
    <LoginOauthCallbackPage
      loginPreset={loginPresets.keycloak}
      onLoginComplete={async (auth, redirectTo) => {
        // Extract UTM params from the redirectTo URL and send them to `users.ensureExists` to track them in the database
        let initialUtmSource: string | null = null;
        let initialUtmCampaign: string | null = null;
        let initialUtmContent: string | null = null;

        try {
          const redirectUrl = new URL(redirectTo, window.location.origin);
          initialUtmSource = redirectUrl.searchParams.get('utm_source');
          initialUtmCampaign = redirectUrl.searchParams.get('utm_campaign');
          initialUtmContent = redirectUrl.searchParams.get('utm_content');
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Failed to parse UTM params from redirectTo:', error);
        }

        try {
          const response = await ensureUserExistsMutation.mutateAsync({
            initialUtmSource,
            initialUtmCampaign,
            initialUtmContent,
          });
          if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
              event: 'CompletedSignup',
              new_customer: response.isNewUser,
            });
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error ensuring user exists:', error);
        }
      }}
    />
  );
};
