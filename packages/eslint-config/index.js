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
    ],
    optionalDependencies: false,
  }],
};

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    'eslint-config-domdomegg',
    'eslint-config-turbo',
  ],
  rules,
  overrides: [{
    files: ['*.ts', '*.tsx', '*.mts', '*.cts'],
    rules,
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
    'node_modules/',
  ],
};
