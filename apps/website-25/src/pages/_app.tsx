import '../globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import posthog from 'posthog-js';
/* eslint-disable import/no-extraneous-dependencies */
import { PostHogProvider } from 'posthog-js/react';
import {
  CookieBanner, Footer, constants,
} from '@bluedot/ui';
import { useEffect } from 'react';
import { Router } from 'next/router';
import { Analytics } from '../components/Analytics';
import { Nav } from '../components/Nav';
import { AnnouncementBanner } from '../components/AnnouncementBanner';

if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.error('PostHog key is missing! Check your .env.local file');
  } else {
    console.log('Initializing PostHog...');
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: 'https://analytics.k8s.bluedot.org',
      person_profiles: 'always',
      // TODO:  always is fine for now given we don't actually identify people anywhere
      loaded: (instance) => {
        if (process.env.NEXT_PUBLIC_DEBUG_POSTHOG === 'true') instance.debug();
        if (localStorage.getItem('cookies') === 'rejected') {
          instance.set_config({ persistence: 'memory' });
        }
      },
    });
    console.log('PostHog initialized!');
  }
}

const App: React.FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  useEffect(() => {
    // Setup page view tracking
    const handleRouteChange = () => posthog?.capture('$pageview');
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
      {'rawLayout' in Component && Component.rawLayout
        ? <Component {...pageProps} />
        : (
          <>
            <Nav logo="/images/logo/BlueDot_Impact_Logo.svg" courses={constants.COURSES} />
            <AnnouncementBanner ctaText="Reserve your free spot" ctaUrl="https://lu.ma/sa52ofdf" hideAfter={new Date('2025-04-25T18:30:00+01:00')}>
              <b>Don't miss this Friday: </b>Planning a career in the age of A(G)I - an online panel with Luke Drago, Josh Landes & Ben Todd
            </AnnouncementBanner>
            <main className="bluedot-base">
              <Component {...pageProps} />
            </main>
            <Footer logo="/images/logo/BlueDot_Impact_Logo_White.svg" />
          </>
        )}
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
