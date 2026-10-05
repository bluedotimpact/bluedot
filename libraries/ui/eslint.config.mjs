import bluedot from '@bluedot/eslint-config';

/** @type {import('typescript-eslint').ConfigArray} */
export default [
  ...bluedot,
  {
    // Everything outside src/server is bundled into client pages, where Next polyfills Node
    // builtins (crypto-browserify, buffer, stream...) and bloats the shared chunk. Put
    // server-only code in src/server/ and export it from src/api.ts.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/server/**'],
    rules: {
      'import/no-nodejs-modules': 'error',
    },
  },
];
