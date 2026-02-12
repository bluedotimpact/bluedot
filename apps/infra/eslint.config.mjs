import bluedot from '@bluedot/eslint-config';

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
