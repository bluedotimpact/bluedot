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
import { trpc } from '../utils/trpc';

const AnnouncementBanner = dynamic(() => import('../components/AnnouncementBanner'), { ssr: false });
// Dynamic import prevents SSR execution - required because Customer.io package has circular dependencies
const CustomerioAnalytics = dynamic(() => import('../components/analytics/CustomerioAnalytics'), { ssr: false });

const App: React.FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();
  const fromSiteParam = router.query.from_site as string;
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
                <Nav />
                {fromSite && (
                  <AnnouncementBanner ctaText="Learn more" ctaUrl="/blog/course-website-consolidation">
                    <b>Welcome from {fromSite === 'aisf' ? 'AI Safety Fundamentals' : 'Biosecurity Fundamentals'}!</b> We've consolidated our course sites in the BlueDot Impact platform to provide a more consistent and higher-quality experience.
                  </AnnouncementBanner>
                )}
                {router.pathname === '/courses/[courseSlug]/[unitNumber]/[[...chunkNumber]]'
                  && router.query.courseSlug === 'technical-ai-safety' && (
                  <AnnouncementBanner hideAfter={new Date('2025-10-31T23:59:59+01:00')}>
                    <b>🛠 Under construction</b>: Check back after Oct 31 for the updated version!
                  </AnnouncementBanner>
                )}
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
          <CustomerioAnalytics />
          <CircleWidget />
        </div>
      </PostHogProvider>
    </LatestUtmParamsProvider>
  );
};

export default trpc.withTRPC(App);
