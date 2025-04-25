/**
 * @param {import('next').NextConfig & { headers: Header[] }} [config]
 * @returns {import('next').NextConfig}
 */
const withDefaultBlueDotNextConfig = async (config) => ({
  reactStrictMode: true,
  output: 'standalone',
  distDir: 'dist',
  poweredByHeader: false,
  // We already run eslint as a separate step
  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: false,

  ...config,

  transpilePackages: ['@bluedot/ui', ...(config?.transpilePackages ?? [])],
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
    },
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization',
        },
      ],
    },
    ...(config?.headers ?? [])];
  },
});

module.exports = { withDefaultBlueDotNextConfig };
