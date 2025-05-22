import '../globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { CTALinkOrButton, Footer } from '@bluedot/ui';
import { useRouter } from 'next/router';
import { GoogleTagManager } from '../components/analytics/GoogleTagManager';
import { PostHogProvider } from '../components/analytics/PostHogProvider';
import { Nav } from '../components/Nav/Nav';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { CookieBanner } from '../components/CookieBanner';

const App: React.FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  const fromSiteParam = useRouter().query.from_site as string;
  const fromSite = ['aisf', 'bsf'].includes(fromSiteParam) ? fromSiteParam as 'aisf' | 'bsf' : null;
  const hideFooter = 'hideFooter' in Component;

  return (
    <PostHogProvider>
      <Head>
        <title>BlueDot Impact</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </Head>
      {/* TODO: remove this logic after people stop going here */}
      {/* eslint-disable-next-line no-nested-ternary */}
      {typeof window !== 'undefined' && window.location.host === 'website-25-staging.k8s.bluedot.org' ? (
        <main className="section-base my-16 prose">
          <h1>You're using the old URL</h1>
          <p>Hey, this is the old URL for the staging website. We dropped the '25' from the URL on 25th April 2025. This URL will stop working soon so update your bookmarks/clear this from your history :)</p>
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
              <Nav logo="/images/logo/BlueDot_Impact_Logo.svg" />
              {fromSite && (
                <AnnouncementBanner ctaText="Learn more" ctaUrl="/blog/course-website-consolidation">
                  <b>Welcome from {fromSite === 'aisf' ? 'AI Safety Fundamentals' : 'Biosecurity Fundamentals'}!</b> We've consolidated our course sites in the BlueDot Impact platform to provide a more consistent and higher-quality experience.
                </AnnouncementBanner>
              )}
              <AnnouncementBanner ctaText="Reserve your free spot" ctaUrl="https://lu.ma/sa52ofdf?utm_source=website&utm_campaign=banner" hideAfter={new Date('2025-04-25T18:30:00+01:00')}>
                <b>Don't miss this Friday: </b>Planning a career in the age of A(G)I - an online panel with Luke Drago, Josh Landes & Ben Todd
              </AnnouncementBanner>
              <main className="bluedot-base">
                <Component {...pageProps} />
              </main>
              {!hideFooter && <Footer logo="/images/logo/BlueDot_Impact_Logo_White.svg" />}
            </>
          ))}
      <CookieBanner />
      <GoogleTagManager />
    </PostHogProvider>
  );
};

export default App;
