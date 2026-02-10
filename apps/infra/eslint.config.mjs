import bluedot from '@bluedot/eslint-config-v9';

/** @type {import('typescript-eslint').ConfigArray} */
export default [
  ...bluedot,
  {
    rules: {
      // Pulumi depends heavily on using new for side effects
      'no-new': 'off',
    },
  },
];
