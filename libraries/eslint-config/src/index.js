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
      '**/drizzle.config.ts', // drizzle ORM config

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

  // Often makes things worse, given it encourages moving related code out of the class
  'class-methods-use-this': ['off'],

  // Tailwind rules
  'tailwindcss/no-contradicting-classname': ['error'],
  'tailwindcss/no-unnecessary-arbitrary-value': ['error'],
  'tailwindcss/enforces-shorthand': ['error'],

  // Overrides airbnb config to remove banning ForOfStatement
  // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js#L338-L358
  'no-restricted-syntax': [
    'error',
    {
      selector: 'ForInStatement',
      message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
    },
    {
      selector: 'LabeledStatement',
      message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
    },
    {
      selector: 'WithStatement',
      message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
    },
  ],

  // Custom rules
  '@bluedot/custom/no-default-tailwind-tokens': ['error'],
  '@bluedot/custom/no-overflow-scroll': ['error'],

  // React hooks rules
  'react-hooks/set-state-in-effect': ['off'],

  // Allow all button types (airbnb disallows reset by default)
  'react/button-has-type': ['error', {
    button: true,
    submit: true,
    reset: true,
  }],
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

  // Mainly based on https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/eslintrc/stylistic.ts
  '@typescript-eslint/array-type': ['error'],
  '@typescript-eslint/consistent-generic-constructors': ['error'],
  '@typescript-eslint/consistent-indexed-object-style': ['error'],
  '@typescript-eslint/consistent-type-assertions': ['error'],
  '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
  '@typescript-eslint/no-inferrable-types': ['error'],
  '@typescript-eslint/prefer-for-of': ['error'],
  '@typescript-eslint/prefer-function-type': ['error'],
};

/** @type {import("eslint").Linter.Config} */
module.exports = {
  plugins: [
    'eslint-plugin-tailwindcss',
    '@bluedot/eslint-plugin-custom',
  ],
  extends: [
    'eslint-config-domdomegg',
    'eslint-config-turbo',
    'plugin:react-hooks/recommended',
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
    'next-env.d.ts',
  ],
};
