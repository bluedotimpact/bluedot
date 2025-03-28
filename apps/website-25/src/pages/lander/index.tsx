import { useEffect } from 'react';
import { useRouter } from 'next/router';

const landingPages = [
  '/lander/classic',
  '/lander/another',
  '/lander/fing_awesome',
  '/lander/everyone_voice',
  '/lander/everyone_community',
  '/lander/jobs_optional_learn_skills',
  '/lander/jobs_optional_save_time',
];

const LandingPageRouter = () => {
  const router = useRouter();

  useEffect(() => {
    // Only run on the client side
    if (typeof window !== 'undefined') {
      const landingPageIndex = Math.floor(Math.random() * landingPages.length);
      const landingPageBaseUrl = landingPages[landingPageIndex];

      // Get the current query parameters
      const queryParams = new URLSearchParams(window.location.search);

      // Redirect to the selected landing page with all query parameters
      // Using object format to fix TypeScript error
      router.replace({
        pathname: landingPageBaseUrl,
        search: queryParams.toString(),
      });
    }
  }, [router]);

  // Return null as we're just redirecting
  return null;
};

LandingPageRouter.rawLayout = true;

export default LandingPageRouter;
