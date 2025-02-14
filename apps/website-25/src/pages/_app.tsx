import '../globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import posthog from 'posthog-js';
/* eslint-disable import/no-extraneous-dependencies */
import { PostHogProvider } from 'posthog-js/react';
import {
  CookieBanner, Footer, isCurrentPath, Nav, constants,
} from '@bluedot/ui';
import clsx from 'clsx';
import { useEffect } from 'react';
import { Router } from 'next/router';
import { Analytics } from '../components/Analytics';

if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.error('PostHog key is missing! Check your .env.local file');
  } else {
    console.log('Initializing PostHog...');
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: 'https://analytics.k8s.bluedot.org',
      person_profiles: 'always',
      // TODO: Do we want this to be "identified_only" or "always"?
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
      <Nav
        logo="/images/logo/BlueDot_Impact_Logo.svg"
        courses={constants.COURSES}
      >
        <a href="/about" className={clsx('hover:text-bluedot-normal', isCurrentPath('/about') && 'font-bold')}>About</a>
        <a href="/careers" className={clsx('hover:text-bluedot-normal', isCurrentPath('/careers') && 'font-bold')}>Join us</a>
        <a href="https://bluedot.org/blog/" className="hover:text-bluedot-normal">Blog</a>
      </Nav>
      <main className="bluedot-base">
        <Component {...pageProps} />
      </main>
      <CookieBanner />
      <Footer logo="/images/logo/BlueDot_Impact_Logo_White.svg" />
      <Analytics />
    </PostHogProvider>
  );
};

const AppWithNoSsr = dynamic(
  () => Promise.resolve(App),
  { ssr: false },
);

export default AppWithNoSsr;
