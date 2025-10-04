import '../globals.css';
import '../lib/axios'; // Configure axios-hooks
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Footer, LatestUtmParamsProvider } from '@bluedot/ui';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { GoogleTagManager } from '../components/analytics/GoogleTagManager';
import { PostHogProvider } from '../components/analytics/PostHogProvider';
import { Nav } from '../components/Nav/Nav';
import { CookieBanner } from '../components/CookieBanner';
import { CircleWidget } from '../components/community/CircleWidget';
import { useCourses } from '../lib/hooks/useCourses';
import { inter } from '../lib/fonts';

const AnnouncementBanner = dynamic(() => import('../components/AnnouncementBanner'), { ssr: false });

const App: React.FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  const fromSiteParam = useRouter().query.from_site as string;
  const fromSite = ['aisf', 'bsf'].includes(fromSiteParam) ? fromSiteParam as 'aisf' | 'bsf' : null;
  const hideFooter = 'hideFooter' in Component;
  const { courses, loading } = useCourses();

  return (
    <LatestUtmParamsProvider>
      <PostHogProvider>
        <div className={inter.className}>
          <Head>
            <title>BlueDot Impact</title>
            <link rel="icon" href="/favicon.ico" />
            <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          </Head>
          {'rawLayout' in Component && Component.rawLayout
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
                <AnnouncementBanner ctaText="Apply by Sept 21" ctaUrl="https://bluedot.org/courses/agi-strategy" hideAfter={new Date('2025-09-19T18:30:00+01:00')}>
                  <b>$1M available: </b>Applications are open for our AGI Strategy Course. Navigate the decade ahead and turn uncertainty into fundable action plans.
                </AnnouncementBanner>
                <main className="bluedot-base">
                  <Component {...pageProps} />
                </main>
                {!hideFooter && (
                  <Footer
                    courses={courses.map((course) => ({
                      path: course.path,
                      title: course.title,
                    }))}
                    loading={loading}
                    logo="/images/logo/BlueDot_Impact_Logo_White.svg"
                  />
                )}
              </>
            )}
          <CookieBanner />
          <GoogleTagManager />
          <CircleWidget />
        </div>
      </PostHogProvider>
    </LatestUtmParamsProvider>
  );
};

export default App;
