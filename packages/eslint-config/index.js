const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    'eslint-config-domdomegg',
    'eslint-config-turbo',
  ],
  settings: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'axios',
            importNames: [
              'default',
              'axios',
            ],
            message: 'Use src/components/networking.ts instead',
          },
        ],
      },
    ],
  },
  ignorePatterns: [
    // dotfiles
    '.*.js',
    'node_modules/',
  ],
};
