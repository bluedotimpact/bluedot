import { Router } from 'next/router';
import posthog from 'posthog-js';
import { PostHogProvider as PostHogPostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { useConsentStore } from './consent';

export const PostHogProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return children;
  }

  return <ActivePostHogProvider>{children}</ActivePostHogProvider>;
};

const ActivePostHogProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: 'https://analytics.k8s.bluedot.org',
      capture_performance: true,
      loaded: (instance) => {
        // Can't specify debug reliably via config :(
        // https://github.com/PostHog/posthog-js/issues/1387
        const shouldDebug = process.env.NEXT_PUBLIC_DEBUG_POSTHOG === 'true';
        // This if prevents unnecessary logs about debug mode changing
        if (instance.config.debug !== shouldDebug) {
          instance.debug(shouldDebug);
        }
      },
      persistence: useConsentStore.getState().isConsented ? 'localStorage+cookie' : 'memory',
    });

    // Setup page view tracking
    const handleRouteChange = () => posthog.capture('$pageview');
    Router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      Router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, []);

  return (
    <PostHogPostHogProvider client={posthog}>
      <PostHogConsentListener />
      {children}
    </PostHogPostHogProvider>
  );
};

const PostHogConsentListener: React.FC = () => {
  const isConsented = useConsentStore((s) => s.isConsented);

  useEffect(() => {
    if (isConsented) {
      posthog.set_config({ persistence: 'localStorage+cookie' });
    } else {
      posthog.set_config({ persistence: 'memory' });
    }
  }, [isConsented]);

  return null;
};
