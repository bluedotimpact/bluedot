/** @type {import("eslint").Linter.RulesRecord} */
const rules = {
  'no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: 'process',
          importNames: [
            'env',
          ],
          message: 'Use src/env.ts instead',
        },
      ],
    },
  ],
  'import/no-extraneous-dependencies': ['error', {
    devDependencies: [
      // From airbnb, plus typescript
      'test/**', // tape, common npm pattern
      'tests/**', // also common npm pattern
      'spec/**', // mocha, rspec-like pattern
      '**/__tests__/**', // jest pattern
      '**/__mocks__/**', // jest pattern
      'test.{js,jsx,ts,tsx}', // repos with a single test file
      'test-*.{js,jsx,ts,tsx}', // repos with multiple top-level test files
      '**/*{.,_}{test,spec}.{js,jsx,ts,tsx}', // tests where the extension or filename suffix denotes that it is a test
      '**/jest.config.js', // jest config
      '**/jest.setup.js', // jest setup
      '**/vue.config.js', // vue-cli config
      '**/webpack.config.js', // webpack config
      '**/webpack.config.*.js', // webpack config
      '**/rollup.config.js', // rollup config
      '**/rollup.config.*.js', // rollup config
      '**/gulpfile.js', // gulp config
      '**/gulpfile.*.js', // gulp config
      '**/Gruntfile{,.js}', // grunt config
      '**/protractor.conf.js', // protractor config
      '**/protractor.conf.*.js', // protractor config
      '**/karma.conf.js', // karma config
      '**/.eslintrc.js', // eslint config

      // Extras
      '**/tools/**', // development tools and scripts
      '**/vite.config.ts',
      '**/vitest.config.ts',
      '**/tailwind.config.ts',
      '**/postcss.config.js',
    ],
    optionalDependencies: false,
  }],
  'jsx-a11y/label-has-associated-control': ['error', {
    controlComponents: ['Input', 'Textarea'],
  }],
  // Almost always a false positive on the <Link> component
  'jsx-a11y/anchor-is-valid': ['off'],
  'tailwindcss/no-unnecessary-arbitrary-value': ['error'],
};

/** @type {import("eslint").Linter.RulesRecord} */
const tsOnlyRules = {
  // This is rarely a value add: if we're already adding a TS comment, we're going to be ignoring some warnings
  '@typescript-eslint/ban-ts-comment': ['off'],

  // Based on airbnb-typescript, but with support for leading underscores
  '@typescript-eslint/naming-convention': [
    'error',
    {
      selector: 'variable',
      format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
      leadingUnderscore: 'allow',
    },
    {
      selector: 'function',
      format: ['camelCase', 'PascalCase'],
      leadingUnderscore: 'allow',
    },
    {
      selector: 'typeLike',
      format: ['PascalCase'],
      leadingUnderscore: 'allow',
    },
  ],
};

/** @type {import("eslint").Linter.Config} */
module.exports = {
  plugins: ['tailwindcss'],
  extends: [
    'eslint-config-domdomegg',
    'eslint-config-turbo',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules,
  overrides: [{
    files: ['*.ts', '*.tsx', '*.mts', '*.cts'],
    rules: { ...rules, ...tsOnlyRules },
  }, {
    files: ['apps/infra/**'],
    rules: {
      // Pulumi depends heavily on using new for side effects
      'no-new': ['off'],
    },
  }],
  ignorePatterns: [
    // dotfiles
    '.*.js',
    'dist',
    'dist_*',
    'generated/',
    'storybook-static/',
    'node_modules/',
  ],
};
