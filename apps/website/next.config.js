const { withDefaultBlueDotNextConfig } = require('@bluedot/ui/src/default-config/next');

module.exports = withDefaultBlueDotNextConfig({
  async redirects() {
    return [
      {
        source: '/running-versions-of-our-courses',
        destination: '/blog/running-versions-of-our-courses',
        permanent: true,
      },
      {
        source: '/blog/:slug',
        destination: 'https://blog.bluedot.org/p/:slug',
        permanent: true,
      },
      {
        source: '/projects',
        destination: 'https://blog.bluedot.org/s/projects',
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
        source: '/mentor',
        destination: '/join-us/coach',
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
