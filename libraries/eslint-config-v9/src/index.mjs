/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved */
// This file's deps are all devDependencies. The IDE doesn't know that because
// eslint.useFlatConfig is disabled globally (for workspaces still on ESLint 8).
// Once everything is using ESLint 9 we can flip this to true.
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import xoConfig from 'eslint-config-xo-typescript';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import turbo from 'eslint-config-turbo/flat';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import customPlugin from '@bluedot/eslint-plugin-custom';

// Process xo-typescript configs:
const processedXoConfig = xoConfig.map((c) => {
  const result = { ...c };

  if (c.plugins?.['@typescript-eslint']) {
    result.files = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'];
    result.languageOptions = {
      ...c.languageOptions,
      parserOptions: {
        ...c.languageOptions?.parserOptions,
        projectService: true,
      },
    };

    // Remove to avoid redefinition, we register it globally above
    const { '@typescript-eslint': _, ...otherPlugins } = c.plugins;
    result.plugins = otherPlugins;
  }

  return result;
});

/** @type {import('typescript-eslint').ConfigArray} */
export default [
  // ── Base configs ──────────────────────────────────────────────────────

  // Register plugins globally (available to all files)
  {
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      react: reactPlugin,
      'jsx-a11y': jsxA11y,
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
      '@bluedot/custom': customPlugin,
    },
  },

  // ESLint recommended
  eslint.configs.recommended,

  // React recommended + JSX runtime + hooks
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  { rules: { ...reactHooksPlugin.configs.recommended.rules } },

  // XO TypeScript (comprehensive TS + JS rules, processed above)
  ...processedXoConfig,

  // Turbo
  ...turbo,

  // ── General rules (all files) ─────────────────────────────────────────
  {
    rules: {
      // Override XO style defaults to match existing codebase conventions
      '@stylistic/indent': ['error', 2],
      '@stylistic/indent-binary-ops': ['error', 2],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/block-spacing': ['error', 'always'],
      '@stylistic/jsx-quotes': ['error', 'prefer-double'],

      // Turn off opinionated XO rules that don't match existing conventions
      '@stylistic/no-mixed-operators': 'off',
      '@stylistic/multiline-ternary': 'off',
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/max-len': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/switch-exhaustiveness-check': 'off',
      '@typescript-eslint/prefer-readonly': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      'new-cap': 'off',
      'no-eq-null': 'off',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'func-names': 'off',
      'func-name-matching': 'off',
      radix: 'off',
      'no-use-before-define': 'off',
      'arrow-body-style': 'off',
      'max-len': 'off',
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
      'capitalized-comments': 'off',
      complexity: 'off',
      'no-warning-comments': 'off',
      'max-params': 'off',
      'no-negated-condition': 'off',
      curly: ['error', 'multi-line', 'consistent'],
      'no-param-reassign': 'error',
      'logical-assignment-operators': 'off',
      'no-implicit-coercion': 'off',
      'no-console': 'warn',
      'prefer-template': 'error',

      // Import plugin rules
      'import/no-extraneous-dependencies': ['error', {
        devDependencies: [
          'test/**',
          'tests/**',
          'spec/**',
          '**/__tests__/**',
          '**/__mocks__/**',
          'test.{js,jsx,ts,tsx}',
          'test-*.{js,jsx,ts,tsx}',
          '**/*{.,_}{test,spec}.{js,jsx,ts,tsx}',
          '**/jest.config.js',
          '**/jest.setup.js',
          '**/webpack.config.js',
          '**/webpack.config.*.js',
          '**/rollup.config.js',
          '**/rollup.config.*.js',
          '**/gulpfile.js',
          '**/gulpfile.*.js',
          '**/.eslintrc.js',
          '**/eslint.config.mjs',
          '**/drizzle.config.ts',
          '**/tools/**',
          '**/vite.config.ts',
          '**/vitest.config.ts',
          '**/vitest.config.mjs',
          '**/tailwind.config.ts',
          '**/postcss.config.js',
        ],
        optionalDependencies: false,
      }],
      'import/no-cycle': 'off',

      // Valuable new XO rules: disabled for migration, would be nice to enable later
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-floating-promises': 'off',

      // Bluedot-specific rules
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

      // React overrides
      'react/prop-types': 'off',
      'react/require-default-props': 'off',
      'react/jsx-one-expression-per-line': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/display-name': 'off',
      'react/function-component-definition': ['error', {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      }],
      'react/no-unescaped-entities': ['error', {
        forbid: [
          { char: '>', alternatives: ['&gt;'] },
          { char: '}', alternatives: ['&#125;'] },
        ],
      }],
      'react/button-has-type': ['error', {
        button: true,
        submit: true,
        reset: true,
      }],
      'react-hooks/set-state-in-effect': 'off',

      // jsx-a11y overrides
      'jsx-a11y/label-has-associated-control': ['error', {
        assert: 'either',
        controlComponents: ['Input', 'Textarea'],
      }],
      'jsx-a11y/anchor-is-valid': 'off',

      // Custom rules
      '@bluedot/custom/no-default-tailwind-tokens': ['error'],
      '@bluedot/custom/no-overflow-scroll': ['error'],
    },
  },

  // ── TypeScript-only overrides ─────────────────────────────────────────
  // Must use files pattern matching xo-typescript's TS plugin scope,
  // otherwise ESLint throws "Could not find plugin" for non-TS files
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    rules: {
      // Turn off opinionated XO/TS rules that don't match existing conventions
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-restricted-types': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      '@typescript-eslint/promise-function-async': 'off',

      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
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
      '@typescript-eslint/consistent-type-assertions': ['error', {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'allow',
      }],
    },
  },

  // ── Workspace-specific overrides ──────────────────────────────────────

  // Infra: Pulumi depends heavily on using new for side effects
  {
    files: ['apps/infra/**'],
    rules: {
      'no-new': 'off',
    },
  },

  // CommonJS config files (next.config.js, postcss.config.js, etc.)
  {
    files: ['**/*.config.js', '**/*.config.cjs'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // ── Global ignores ────────────────────────────────────────────────────

  {
    ignores: [
      '**/.*.js',
      '**/dist/**',
      '**/dist_*/**',
      '**/generated/**',
      '**/storybook-static/**',
      '**/node_modules/**',
      '**/next-env.d.ts',
    ],
  },
];
