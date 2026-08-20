const { withSentryConfig } = require('@sentry/nextjs');
const { withDefaultBlueDotNextConfig } = require('@bluedot/ui/src/default-config/next');

// Shortlinks previously handled by apps/website-proxy nginx, ported here so the
// image is self-sufficient on Render (no nginx in front of bluedot.org).
// nginx returned 301s, so these use statusCode: 301 rather than permanent (308).
const proxyPortedRedirects = [
  {
    source: '/:path*',
    has: [{ type: 'host', value: 'www.bluedot.org' }],
    destination: 'https://bluedot.org/:path*',
    statusCode: 301,
  },
  ...[
    ['/intro-to-tai', '/courses/intro-to-tai'],
    ['/writing', '/courses/writing'],
    ['/alignment', '/courses/alignment'],
    ['/alignment-fast-track', '/courses/alignment'],
    ['/governance', '/courses/governance'],
    ['/governance-fast-track', '/courses/governance'],
    ['/economics-of-tai', '/courses/economics-of-tai'],
    ['/economics-of-tai-fast-track', '/courses/economics-of-tai'],
    ['/pandemics', '/courses/biosecurity'],
    ['/courses/pandemics', '/courses/biosecurity'],
    ['/careers', '/join-us'],
    ['/careers/swe-contractor', '/join-us/swe-contractor'],
    ['/careers/ai-safety-teaching-fellow', '/join-us/ai-safety-teaching-fellow'],
    ['/ai-alignment-curriculum', '/courses/alignment'],
    ['/ai-governance-curriculum', '/courses/governance'],
    ['/alignment-course-details', '/courses/alignment'],
    ['/governance-course-details', '/courses/governance'],
    ['/alignment-insession-readings', '/courses/alignment'],
    ['/alignment-201-curriculum', '/courses/alignment-201'],
  ].map(([source, destination]) => ({ source, destination, statusCode: 301 })),
];

const baseConfig = withDefaultBlueDotNextConfig({
  async redirects() {
    return [
      ...proxyPortedRedirects,
      {
        source: '/company-information',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/running-versions-of-our-courses',
        destination: '/blog/running-versions-of-our-courses',
        permanent: true,
      },
      {
        source: '/blog',
        destination: 'https://blog.bluedot.org',
        permanent: true,
      },
      {
        source: '/blog/:slug',
        destination: 'https://blog.bluedot.org/p/:slug',
        permanent: true,
      },
      {
        source: '/projects',
        destination: '/courses#projects',
        permanent: true,
      },
      {
        source: '/projects/:slug',
        destination: 'https://blog.bluedot.org/p/:slug',
        permanent: true,
      },
      {
        source: '/courses/governance',
        destination: '/courses/ai-governance',
        permanent: true,
      },
      {
        source: '/courses/incubator-week',
        destination: '/programs/incubator-week',
        permanent: true,
      },
      {
        source: '/courses/incubator-week/:path*',
        destination: '/programs/incubator-week',
        permanent: true,
      },
      {
        source: '/programs/builder-week',
        destination: '/programs',
        permanent: true,
      },
      {
        source: '/programs/fieldbuilder-week',
        destination: '/programs',
        permanent: true,
      },
      {
        source: '/programs/advising',
        destination: '/grants/career-transition',
        permanent: true,
      },
      {
        source: '/programs/career-transition-grant',
        destination: '/grants/career-transition',
        permanent: true,
      },
      {
        source: '/programs/rapid-grants',
        destination: '/grants/rapid',
        permanent: true,
      },
      {
        source: '/programs/technical-ai-safety-project-sprint',
        destination: '/courses/technical-ai-safety-project',
        permanent: true,
      },
      {
        source: '/mentor',
        destination: '/join-us/coach',
        permanent: true,
      },
      {
        source: '/grants/agi-strategy-fund',
        destination: '/grants',
        permanent: true,
      },
      {
        source: '/grants/bridge',
        destination: '/grants',
        permanent: true,
      },
      {
        source: '/join-us/mentor',
        destination: '/join-us/coach',
        permanent: true,
      },
      {
        source: '/facilitate',
        destination: '/join-us/facilitate',
        permanent: true,
      },
      {
        source: '/petr',
        destination: '/?utm_source=petr&utm_medium=youtube&utm_campaign=petr',
        permanent: false,
      },
      {
        source: '/settings/courses',
        destination: '/my-courses',
        statusCode: 301,
      },
      {
        source: '/settings/account',
        destination: '/account',
        statusCode: 301,
      },
    ];
  },
  async rewrites() {
    return [
      // Legacy uploads server (old bluedot.org box), still referenced by the AISF/BSF
      // sites; also ported from the website-proxy nginx config. nginx sent
      // `Host: bluedot.org` and SNI `bluedot.org` to this upstream; Next.js's rewrite
      // proxy instead sends Host/SNI for the bare IP, which may break the upstream's
      // TLS cert validation or vhost matching — verify /u/ paths after deploy.
      {
        source: '/u/:path*',
        destination: 'https://45.76.132.116/u/:path*',
      },
    ];
  },
  headers: [
    {
      source: '/fonts/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, OPTIONS',
        },
      ],
    },
  ],
});

// withDefaultBlueDotNextConfig is async; withSentryConfig needs the resolved object
module.exports = async () => withSentryConfig(await baseConfig, {
  org: 'bluedotimpact',
  project: 'website',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  // Tags our bundled modules as first-party so thirdPartyErrorFilterIntegration
  // (instrumentation-client.ts) can drop errors thrown solely by extension scripts.
  applicationKey: 'bluedot-website',
  tunnelRoute: true,
  silent: !process.env.CI,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
