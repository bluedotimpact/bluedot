import { LoginOauthCallbackPage, loginPresets } from '@bluedot/ui';
import posthog from 'posthog-js';
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
        let initialUtmMedium: string | null = null;
        let initialUtmTerm: string | null = null;

        try {
          const redirectUrl = new URL(redirectTo, window.location.origin);
          initialUtmSource = redirectUrl.searchParams.get('utm_source');
          initialUtmCampaign = redirectUrl.searchParams.get('utm_campaign');
          initialUtmContent = redirectUrl.searchParams.get('utm_content');
          initialUtmMedium = redirectUrl.searchParams.get('utm_medium');
          initialUtmTerm = redirectUrl.searchParams.get('utm_term');
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

          if (typeof window !== 'undefined' && response.isNewUser) {
            // Set initial UTM params in PostHog for new users. They
            // should be captured automatically by posthog, but because the
            // first landing page has the UTM params buried in `redirectUrl` they
            // may be dropped.
            const initialUtmParams: Record<string, string> = {};
            if (initialUtmSource) initialUtmParams.$initial_utm_source = initialUtmSource;
            if (initialUtmCampaign) initialUtmParams.$initial_utm_campaign = initialUtmCampaign;
            if (initialUtmContent) initialUtmParams.$initial_utm_content = initialUtmContent;
            if (initialUtmMedium) initialUtmParams.$initial_utm_medium = initialUtmMedium;
            if (initialUtmTerm) initialUtmParams.$initial_utm_term = initialUtmTerm;

            if (Object.keys(initialUtmParams).length > 0) {
              posthog.capture('$set', { $set: initialUtmParams });
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error ensuring user exists:', error);
        }
      }}
    />
  );
};
