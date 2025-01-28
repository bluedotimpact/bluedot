/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@bluedot/eslint-config"],
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: true, // Allow devDependencies in test files
        optionalDependencies: false,
        peerDependencies: false,
      },
    ],
  },
};
