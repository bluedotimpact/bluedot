import '../globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import posthog from 'posthog-js';
/* eslint-disable import/no-extraneous-dependencies */
import { PostHogProvider } from 'posthog-js/react';
import {
  CTALinkOrButton,
  CookieBanner, Footer, constants,
} from '@bluedot/ui';
import { useEffect } from 'react';
import { Router } from 'next/router';
import { Analytics } from '../components/Analytics';
import { Nav } from '../components/Nav';
import { AnnouncementBanner } from '../components/AnnouncementBanner';

const App: React.FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      // eslint-disable-next-line no-console
      console.warn('NEXT_PUBLIC_POSTHOG_KEY is missing, disabling analytics...');
      return undefined;
    }

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: 'https://analytics.k8s.bluedot.org',
      loaded: (instance) => {
        // Can't specify debug reliably via config :(
        // https://github.com/PostHog/posthog-js/issues/1387
        const shouldDebug = process.env.NEXT_PUBLIC_DEBUG_POSTHOG === 'true';
        // This if prevents unnecessary logs about debug mode changing
        if (instance.config.debug !== shouldDebug) {
          instance.debug(shouldDebug);
        }
      },
      persistence: localStorage.getItem('cookies') === 'accepted' ? 'localStorage+cookie' : 'memory',
    });

    // Setup page view tracking
    const handleRouteChange = () => posthog.capture('$pageview');
    Router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      Router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <Head>
        <title>BlueDot Impact</title>
        <link rel="icon" type="image/png" href="images/logo/favicon/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="images/logo/favicon/favicon.svg" />
        <link rel="shortcut icon" href="images/logo/favicon/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="images/logo/favicon/apple-touch-icon.png" />
        <link rel="manifest" href="images/logo/favicon/site.webmanifest" />
      </Head>
      {/* TODO: remove this logic after people stop going here */}
      {/* eslint-disable-next-line no-nested-ternary */}
      {typeof window !== 'undefined' && window.location.host === 'website-25-staging.k8s.bluedot.org' ? (
        <main className="section-base my-16 prose">
          <h1>You're using the old URL</h1>
          <p>Hey, this is the old URL for the staging website. We dropped the '25' from the URL on 25th April 2025. This URL will stop working soon so update your bookmarks and clear this from your history :)</p>
          <p><code>website<span className="font-bold bg-red-100">-25</span>-staging.k8s.bluedot.org → <br />website-staging.k8s.bluedot.org</code></p>
          <CTALinkOrButton url={typeof window === 'undefined' ? 'https://website-staging.k8s.bluedot.org' : window.location.href.replace(window.location.host, 'website-staging.k8s.bluedot.org')} className="not-prose" withChevron>
            View this page on the new site
          </CTALinkOrButton>
        </main>
      )
        : ('rawLayout' in Component && Component.rawLayout
          ? <Component {...pageProps} />
          : (
            <>
              <Nav logo="/images/logo/BlueDot_Impact_Logo.svg" courses={constants.COURSES} />
              <AnnouncementBanner ctaText="Reserve your free spot" ctaUrl="https://lu.ma/sa52ofdf?utm_source=website&utm_campaign=banner" hideAfter={new Date('2025-04-25T18:30:00+01:00')}>
                <b>Don't miss this Friday: </b>Planning a career in the age of A(G)I - an online panel with Luke Drago, Josh Landes & Ben Todd
              </AnnouncementBanner>
              <main className="bluedot-base">
                <Component {...pageProps} />
              </main>
              <Footer logo="/images/logo/BlueDot_Impact_Logo_White.svg" />
            </>
          ))}
      <CookieBanner />
      <Analytics />
    </PostHogProvider>
  );
};

const AppWithNoSsr = dynamic(
  () => Promise.resolve(App),
  { ssr: false },
);

export default AppWithNoSsr;
