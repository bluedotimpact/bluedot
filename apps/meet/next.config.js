const { withDefaultBlueDotNextConfig } = require('@bluedot/ui/src/default-config/next');

module.exports = withDefaultBlueDotNextConfig({
  // See https://developers.zoom.us/docs/meeting-sdk/web/sharedarraybuffer/
  headers: [{
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
  }],
});
