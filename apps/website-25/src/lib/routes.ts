export type BluedotRoute = {
  /**
   * Title of the page, by convention this is the title that appears in the
   * <title /> tag (e.g. "About us" in "About us | BlueDot Impact")
   */
  title: string;
  /**
   * Relative url of the route (e.g. /about, not https://bluedot.org/about)
   */
  url: string;
};

export const ROUTES = {
  home: {
    title: 'BlueDot Impact',
    url: '/',
  },
  about: {
    title: 'About us',
    url: '/about',
  },
  privacyPolicy: {
    title: 'Privacy Policy',
    url: '/privacy-policy',
  },
  careers: {
    title: 'Join our team',
    url: '/careers',
  },
} as const;
