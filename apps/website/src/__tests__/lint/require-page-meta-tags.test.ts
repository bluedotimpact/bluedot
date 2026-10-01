// @vitest-environment node
import { ESLint } from 'eslint';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

// Runs the real ESLint with this app's config, so it also proves the rule is switched on for the right files
const eslint = new ESLint({ cwd: path.resolve(__dirname, '../../..') });
const RULE = '@bluedot/custom/require-page-meta-tags';

const ruleErrors = async (code: string, filePath: string) => {
  const [result] = await eslint.lintText(code, { filePath });
  expect(result!.messages.filter((m) => m.fatal)).toEqual([]);
  return result!.messages.filter((m) => m.ruleId === RULE);
};

const pageWithHead = (head: string) => `import Head from 'next/head';

const Page = () => (
  <Head>
    ${head}
  </Head>
);

export default Page;
`;

describe('require-page-meta-tags lint rule', () => {
  test.each([
    ['<title>About</title>'],
    ['<meta name="description" content="x" />'],
    ['<meta property="og:title" content="x" />'],
    ['<meta property="og:description" content="x" />'],
    ['<meta name="twitter:title" content="x" />'],
    ['<meta name="twitter:description" content="x" />'],
    ['<meta name="og:title" content="x" />'],
    ['<meta property="twitter:title" content="x" />'],
    ['<meta name={`description`} content="x" />'],
    ['<meta property={\'og:description\'} content="x" />'],
  ])('flags %s written by hand on a page', async (tag) => {
    const errors = await ruleErrors(pageWithHead(tag), 'src/pages/about.tsx');

    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('Use pageMetaTags({ title, description })');
  });

  test.each([
    ['<meta name={tagName} content="x" />'],
    // A template with an expression: `og:${kind}` (built in two parts so this test file isn't one itself)
    [['<meta property={`og:$', '{kind}`} content="x" />'].join('')],
  ])('flags a computed name/property: %s', async (tag) => {
    const errors = await ruleErrors(pageWithHead(tag).replace('const Page', 'const tagName = \'og:title\';\nconst kind = \'title\';\nconst Page'), 'src/pages/about.tsx');

    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('Use a fixed');
  });

  test('allows pageMetaTags() and tags the helper does not write', async () => {
    const head = '{pageMetaTags({ title: \'About\' })}\n    <meta property="og:url" content="x" />\n    <meta name="robots" content="noindex" />';

    expect(await ruleErrors(pageWithHead(head), 'src/pages/about.tsx')).toEqual([]);
  });

  test('allows <title> inside an <svg>, which labels the icon rather than the page', async () => {
    const icon = 'const Icon = () => <svg aria-label="x"><title>Icon</title></svg>;\n\nexport default Icon;\n';

    expect(await ruleErrors(icon, 'src/components/lander/CourseLander.tsx')).toEqual([]);
  });

  test.each([
    ['the helper itself', 'src/lib/linkPreviewMetaTags.tsx'],
    ['the site-wide default in _app.tsx', 'src/pages/_app.tsx'],
  ])('does not apply to %s', async (_label, filePath) => {
    expect(await ruleErrors(pageWithHead('<title>BlueDot Impact</title>'), filePath)).toEqual([]);
  });
}, 60_000);
