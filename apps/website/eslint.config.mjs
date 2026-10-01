import bluedot from '@bluedot/eslint-config';

/** @type {import('typescript-eslint').ConfigArray} */
export default [
  ...bluedot,
  {
    // Page <title>/description must go through pageMetaTags() so link-preview tags are never missed
    files: ['src/**/*.tsx'],
    ignores: [
      'src/lib/linkPreviewMetaTags.tsx', // the helper itself
      'src/pages/_app.tsx', // site-wide default <title> in DefaultHeadTags
      '**/*.test.tsx',
      '**/*.stories.tsx',
    ],
    rules: {
      '@bluedot/custom/require-page-meta-tags': 'error',
    },
  },
];
