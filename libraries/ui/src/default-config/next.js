/* global module */
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
  async headers() {
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
  webpack(webpackConfig, context, ...args) {
    // Exclude packages from webpack bundling

    // Only used server side. Trying to import it client-side results in an error
    if (!context.isServer) {
      webpackConfig.externals.push('winston');
    }

    // https://github.com/open-telemetry/opentelemetry-js/issues/4173

    webpackConfig.ignoreWarnings = webpackConfig.ignoreWarnings ?? [];
    webpackConfig.ignoreWarnings.push({ module: /opentelemetry/, message: /the request of a dependency is an expression/ });

    // Conditionally required, but we don't actually use it
    webpackConfig.externals.push('@opentelemetry/winston-transport');
    webpackConfig.externals.push('@opentelemetry/exporter-jaeger');

    return config?.webpack?.(config, context, ...args) ?? webpackConfig;
  },
});

module.exports = { withDefaultBlueDotNextConfig };
