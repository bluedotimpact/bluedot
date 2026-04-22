import bluedot from '@bluedot/eslint-config';

/** @type {import('typescript-eslint').ConfigArray} */
export default [
  ...bluedot,
  {
    // schema.ts is a single source-of-truth file for ~30+ pgAirtable table
    // definitions; it's expected to grow as tables are added. Keep the rule
    // enabled elsewhere in the package but raise the limit here so the signal
    // remains useful for other files.
    files: ['src/schema.ts'],
    rules: {
      'max-lines': ['warn', { max: 2500, skipComments: true }],
    },
  },
];
