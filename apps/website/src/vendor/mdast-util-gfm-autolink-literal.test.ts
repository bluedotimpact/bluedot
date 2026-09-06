import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const VENDORED_FILE = path.resolve(dirname, 'mdast-util-gfm-autolink-literal.js');

// Byte-for-byte lines. If upstream changes them, this test fails: re-copy the file.
const UPSTREAM_LINE = String.raw`      [/(?<=^|\s|\p{P}|\p{S})([-.\w+]+)@([-\w]+(?:\.[-\w]+)+)/gu, findEmail]`;
const FIXED_LINE = String.raw`      [/([-.\w+]+)@([-\w]+(?:\.[-\w]+)+)/gu, findEmail]`;
const DROPPED_DIRECTIVE = '// eslint-disable-next-line max-params';

describe('vendored mdast-util-gfm-autolink-literal', () => {
  test('contains no lookbehind or named-group constructs (Safari < 16.4 parse safety)', () => {
    const src = fs.readFileSync(VENDORED_FILE, 'utf8');
    expect(src).not.toMatch(/\(\?<[=!]/);
    expect(src).not.toMatch(/\(\?<[A-Za-z_]/);
  });

  test('is upstream 2.0.1 plus the header and exactly two documented line changes', () => {
    const vendored = fs.readFileSync(VENDORED_FILE, 'utf8').split('\n');
    // Our header comes first, so the first ' */' line ends it.
    const headerEnd = vendored.findIndex((line) => line === ' */');
    expect(headerEnd).toBeGreaterThan(0);
    const body = vendored.slice(headerEnd + 1).join('\n');

    const require = createRequire(import.meta.url);
    const installedPath = path.join(
      path.dirname(require.resolve('mdast-util-gfm-autolink-literal')),
      'lib/index.js',
    );
    const installed = fs.readFileSync(installedPath, 'utf8');
    expect(installed.split('\n').filter((line) => line === UPSTREAM_LINE)).toHaveLength(1);
    expect(installed.split('\n').filter((line) => line === DROPPED_DIRECTIVE)).toHaveLength(1);

    const expected = installed
      .replace(UPSTREAM_LINE, FIXED_LINE)
      .replace(`${DROPPED_DIRECTIVE}\n`, '');
    expect(body).toBe(expected);
  });

  test('production webpack config points at the vendored file', () => {
    const nextConfig = fs.readFileSync(path.resolve(dirname, '..', '..', 'next.config.js'), 'utf8');
    expect(nextConfig).toContain('\'mdast-util-gfm-autolink-literal\': path.resolve(__dirname, \'src/vendor/mdast-util-gfm-autolink-literal.js\')');
  });

  test('vitest mirrors the production alias', () => {
    const vitestConfig = fs.readFileSync(path.resolve(dirname, '..', '..', 'vitest.config.mjs'), 'utf8');
    expect(vitestConfig).toContain('\'mdast-util-gfm-autolink-literal\': path.resolve(dirname, \'src/vendor/mdast-util-gfm-autolink-literal.js\')');
  });
});
