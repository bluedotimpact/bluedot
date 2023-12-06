/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@bluedot/eslint-config/next.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
};
