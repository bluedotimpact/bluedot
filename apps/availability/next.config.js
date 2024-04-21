/** @type {import('next').NextConfig} */
module.exports = {
  transpilePackages: ['@bluedot/ui'],
  reactStrictMode: true,
  output: 'standalone',

  // We already run eslint as a separate step
  eslint: {
    ignoreDuringBuilds: true,
  },

  poweredByHeader: false,
  headers: async () => {
    return [
      // See https://developers.zoom.us/docs/meeting-sdk/web/sharedarraybuffer/
      {
        source: '/',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Bluedot-Version',
            // eslint-disable-next-line turbo/no-undeclared-env-vars
            value: process.env.VERSION_TAG || 'unknown',
          },
        ],
      },
    ];
  },
};
