const { withDefaultBlueDotNextConfig } = require('@bluedot/ui/src/default-config/next');

module.exports = withDefaultBlueDotNextConfig({
  async redirects() {
    return [{
      source: '/',
      has: [{ type: 'host', value: 'speed-review.k8s.bluedot.org' }],
      destination: 'https://apps.bluedot.org/speed-review',
      permanent: false,
    }];
  },
});
