const { withDefaultBlueDotNextConfig } = require('@bluedot/ui/src/default-config/next');

module.exports = withDefaultBlueDotNextConfig({
  async redirects() {
    return [
      {
        source: '/running-versions-of-our-courses',
        destination: '/blog/running-versions-of-our-courses',
        permanent: true, // 301 redirect
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
    }],
});
