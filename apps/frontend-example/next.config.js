/** @type {import('next').NextConfig} */
module.exports = {
  transpilePackages: ['@bluedot/ui'],
  reactStrictMode: true,
  output: 'standalone',
  distDir: 'dist',

  // We already run eslint as a separate step
  eslint: {
    ignoreDuringBuilds: true,
  },

  poweredByHeader: false,
  headers: async () => {
    return [{
      source: '/:path*',
      headers: [
        {
          key: 'X-BlueDot-Version',
          // eslint-disable-next-line turbo/no-undeclared-env-vars
          value: process.env.VERSION_TAG || 'unknown',
        },
      ],
    }];
  },
};
