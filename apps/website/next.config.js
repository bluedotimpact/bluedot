const { withSentryConfig } = require('@sentry/nextjs');
const { withDefaultBlueDotNextConfig } = require('@bluedot/ui/src/default-config/next');

const baseConfig = withDefaultBlueDotNextConfig({
  async redirects() {
    return [
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
  tunnelRoute: true,
  silent: !process.env.CI,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
