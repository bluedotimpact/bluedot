import '../globals.css';
import '../lib/axios'; // Configure axios-hooks
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Footer, LatestUtmParamsProvider } from '@bluedot/ui';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { GoogleTagManager } from '../components/analytics/GoogleTagManager';
import { PostHogProvider } from '../components/analytics/PostHogProvider';
import { Header } from '../components/Header';
import { CookieBanner } from '../components/CookieBanner';
import { CircleWidget } from '../components/community/CircleWidget';
import { ImpersonationBadge } from '../components/admin/ImpersonationBadge';
import { useCourses } from '../lib/hooks/useCourses';
import { inter } from '../lib/fonts';
import { trpc } from '../utils/trpc';
import type { FeedbackData } from '@bluedot/ui/src/BugReportModal';

const AnnouncementBanner = dynamic(() => import('../components/AnnouncementBanner'), { ssr: false });
// Dynamic import prevents SSR execution - required because Customer.io package has circular dependencies
const CustomerioAnalytics = dynamic(() => import('../components/analytics/CustomerioAnalytics'), { ssr: false });

const App: React.FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();
  const fromSiteParam = router.query.from_site as string;
  const fromSite = ['aisf', 'bsf'].includes(fromSiteParam) ? fromSiteParam as 'aisf' | 'bsf' : null;
  const hideFooter = 'hideFooter' in Component;
  const { courses, loading } = useCourses();

  const submitBugMutation = trpc.feedback.submitBugReport.useMutation();

  // Used by Birdie feedback widget to store the URL of the recording for the current bug report, if one exists
  const [recordingUrl, setRecordingUrl] = useState<string | undefined>();

  useEffect(() => {
    if (window.innerWidth <= 768) return; // birdie doesn't work on mobile
    if (window.birdie) return; //  prevent fetching on every new page if already exists

    window.birdieSettings = {
      app_id: '4adrhn9g',
      onRecordingPosted: (url) => setRecordingUrl(url),
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://app.birdie.so/widget/${window.birdieSettings.app_id}`;
    document.body.appendChild(script);
  }, []);

  const handleBugReportSubmit = async (data: FeedbackData) => {
    // TODO: call `submitBugMutation`
  };

  const getAnnouncementBanner = () => {
    if (fromSite) {
      return (
        <AnnouncementBanner ctaText="Learn more" ctaUrl="/blog/course-website-consolidation">
          <b>Welcome from {fromSite === 'aisf' ? 'AI Safety Fundamentals' : 'Biosecurity Fundamentals'}!</b> We've consolidated our course sites in the BlueDot Impact platform to provide a more consistent and higher-quality experience.
        </AnnouncementBanner>
      );
    }

    return undefined;
  };

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
                <Header announcementBanner={getAnnouncementBanner()} />
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
                    onRecordScreen={() => window.birdie?.widget.open()}
                    recordingUrl={recordingUrl}
                    onBugReportModalClose={() => setRecordingUrl(undefined)}
                    onBugReportSubmit={handleBugReportSubmit}
                  />
                )}
              </>
            )}
          <CookieBanner />
          <GoogleTagManager />
          <CustomerioAnalytics />
          <CircleWidget />
          <ImpersonationBadge />
        </div>
      </PostHogProvider>
    </LatestUtmParamsProvider>
  );
};

export default trpc.withTRPC(App);
