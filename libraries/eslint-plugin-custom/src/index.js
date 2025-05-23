/** @type {import('eslint').ESLint.Plugin} */
module.exports = {
  rules: {
    'no-default-tailwind-tokens': require('./rules/no-default-tailwind-tokens'),
    'no-overflow-scroll': require('./rules/no-overflow-scroll'),
  },
};
