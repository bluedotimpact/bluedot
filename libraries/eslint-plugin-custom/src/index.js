/** @type {import('eslint').ESLint.Plugin} */
module.exports = {
  rules: {
    'no-default-tailwind-tokens': require('./rules/no-default-tailwind-tokens'),
    'no-overflow-scroll': require('./rules/no-overflow-scroll'),
    'no-arbitrary-text-size': require('./rules/no-arbitrary-text-size'),
    'require-page-meta-tags': require('./rules/require-page-meta-tags'),
    'no-not-null-synced-column': require('./rules/no-not-null-synced-column'),
  },
};
