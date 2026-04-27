import { Footer, LatestUtmParamsProvider } from '@bluedot/ui';
import clsx from 'clsx';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { ImpersonationBadge } from '../components/admin/ImpersonationBadge';
import { GoogleTagManager } from '../components/analytics/GoogleTagManager';
import { PostHogProvider } from '../components/analytics/PostHogProvider';
import { CircleWidget } from '../components/community/CircleWidget';
import { CookieBanner } from '../components/CookieBanner';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Header } from '../components/Header';
import '../globals.css';
import BugReportProvider, { useBugReport } from '../hooks/useBugReport';
import '../lib/axios'; // Configure axios-hooks
import { inter } from '../lib/fonts';
import { useCourses } from '../lib/hooks/useCourses';
import { reportClientError } from '../lib/reportClientError';
import { trpc } from '../utils/trpc';

const AnnouncementBanner = dynamic(() => import('../components/AnnouncementBanner'), { ssr: false });
// Dynamic import prevents SSR execution - required because Customer.io package has circular dependencies
const CustomerioAnalytics = dynamic(() => import('../components/analytics/CustomerioAnalytics'), { ssr: false });

const AppContent: React.FC<AppProps> = ({ Component, pageProps }) => {
  const router = useRouter();
  const fromSiteParam = router.query.from_site as string;
  const fromSite = ['aisf', 'bsf'].includes(fromSiteParam) ? fromSiteParam as 'aisf' | 'bsf' : null;
  const hideFooter = 'hideFooter' in Component;
  const pageRendersOwnNav = 'pageRendersOwnNav' in Component && Boolean(Component.pageRendersOwnNav);
  const { courses, loading } = useCourses();
  const { openBugReport } = useBugReport();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      reportClientError(
        { message: event.message, stack: typeof event.error?.stack === 'string' ? event.error.stack : undefined },
        'window.onerror',
      );
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error
        ? event.reason
        : { message: String(event.reason) };
      reportClientError(error, 'unhandledrejection');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const getAnnouncementBanner = () => {
    if (fromSite) {
      const sourceSiteName = fromSite === 'aisf' ? 'AI Safety Fundamentals' : 'Biosecurity Fundamentals';

      return (
        <AnnouncementBanner
          label={`From ${sourceSiteName}`}
          ctaText="What changed"
          ctaUrl="/blog/course-website-consolidation"
        >
          You&apos;re in the right place. We&apos;ve moved the {sourceSiteName} experience into BlueDot Impact so your courses, account, and community now live on one platform.
        </AnnouncementBanner>
      );
    }

    return undefined;
  };

  return (
    <div className={clsx(inter.className, 'flex flex-col min-h-screen')}>
      <Head>
        <title>BlueDot Impact</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </Head>
      {'rawLayout' in Component && Component.rawLayout ? (
        <ErrorBoundary key={router.asPath}>
          <Component {...pageProps} />
        </ErrorBoundary>
      ) : (
        <>
          <Header announcementBanner={getAnnouncementBanner()} pageRendersOwnNav={pageRendersOwnNav} />
          <main className="bluedot-base flex-1">
            <ErrorBoundary key={router.asPath}>
              <Component {...pageProps} />
            </ErrorBoundary>
          </main>
          {!hideFooter && (
            <Footer
              courses={courses.map((course) => ({
                path: `/courses/${course.slug}`,
                title: course.title,
              }))}
              loading={loading}
              logo="/images/logo/BlueDot_Impact_Logo_White.svg"
              onReportBug={openBugReport}
            />
          )}
        </>
      )}
      {router.pathname !== '/subscription-preferences' && <CircleWidget />}
      <CookieBanner />
      <GoogleTagManager />
      <CustomerioAnalytics />
      <ImpersonationBadge />
    </div>
  );
};

const App: React.FC<AppProps> = (props) => (
  <LatestUtmParamsProvider>
    <PostHogProvider>
      <BugReportProvider>
        <AppContent {...props} />
      </BugReportProvider>
    </PostHogProvider>
  </LatestUtmParamsProvider>
);

export default trpc.withTRPC(App);
