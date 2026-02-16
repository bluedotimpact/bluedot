import eslint from '@eslint/js';

// Minimal config — this package can't lint itself with its own config (circular).
/** @type {import('eslint').Linter.Config[]} */
export default [
  eslint.configs.recommended,
  { ignores: ['node_modules/**'] },
];
