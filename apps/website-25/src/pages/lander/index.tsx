import { useEffect } from 'react';
import { useRouter } from 'next/router';

const landingPages = [
  '/lander/classic',
  '/lander/another',
  '/lander/new-hero',
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
