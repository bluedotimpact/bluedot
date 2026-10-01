// @vitest-environment node
import Head from 'next/head';
import { HeadManagerContext } from 'next/dist/shared/lib/head-manager-context.shared-runtime';
import type { ReactElement, ReactNode } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import {
  describe, expect, test, vi,
} from 'vitest';
import { DefaultHeadTags } from '../../pages/_app';
import { linkPreviewMetaTags, pageMetaTags } from '../../lib/linkPreviewMetaTags';

// next/font/local can't run outside the Next.js build pipeline
vi.mock('../../lib/fonts', () => ({
  inter: { className: 'inter' },
  interDisplay: { variable: '--font-inter-display' },
}));

// Renders like the server does: the real next/head collects every <Head> (the _app defaults, then the
// page) and merges them with its own de-duplication. Returns the final <head> HTML that crawlers get.
const serverHead = (page: ReactNode): string => {
  let elements: ReactElement[] = [];
  renderToString(<HeadManagerContext.Provider value={{
    updateHead: (els: ReactElement[]) => {
      elements = els;
    }, mountedInstances: new Set(),
  }}>
    <DefaultHeadTags />
    {page}
  </HeadManagerContext.Provider>);
  return renderToStaticMarkup(<>{elements}</>);
};

const count = (html: string, attr: string) => html.split(attr).length - 1;
const content = (html: string, attr: string) => new RegExp(`${attr}[^>]*content="([^"]*)"|content="([^"]*)"[^>]*${attr}`).exec(html)?.slice(1).find(Boolean);

describe('pageMetaTags with the real next/head (server-rendered HTML)', () => {
  test('a page title and description replace the site default, with one of each tag', () => {
    const html = serverHead(<Head>{pageMetaTags({ title: 'About us | BlueDot Impact', description: 'Who we are' })}</Head>);

    expect(count(html, '<title>')).toBe(1);
    expect(html).toContain('<title>About us | BlueDot Impact</title>');
    for (const attr of ['name="description"', 'property="og:title"', 'property="og:description"', 'name="twitter:title"', 'name="twitter:description"']) {
      expect(count(html, attr)).toBe(1);
    }

    expect(content(html, 'property="og:title"')).toBe('About us | BlueDot Impact');
    expect(content(html, 'name="twitter:description"')).toBe('Who we are');
    // site-wide defaults from _app are kept
    expect(count(html, 'property="og:site_name"')).toBe(1);
    expect(count(html, 'property="og:image"')).toBe(1);
  });

  test('previewTitle sets the preview title without changing the page title', () => {
    const html = serverHead(<Head>{pageMetaTags({ title: 'AGI Strategy | BlueDot Impact', previewTitle: 'AGI Strategy', description: 'x' })}</Head>);

    expect(html).toContain('<title>AGI Strategy | BlueDot Impact</title>');
    expect(content(html, 'property="og:title"')).toBe('AGI Strategy');
    expect(content(html, 'name="twitter:title"')).toBe('AGI Strategy');
  });

  test('a page image replaces the default image instead of adding a second one', () => {
    const html = serverHead(<Head>
      {pageMetaTags({ title: 'T', description: 'D' })}
      {linkPreviewMetaTags({ imageUrl: 'https://bluedot.org/images/page.png' })}
    </Head>);

    expect(count(html, 'property="og:image"')).toBe(1);
    expect(content(html, 'property="og:image"')).toBe('https://bluedot.org/images/page.png');
  });

  test('no description: no empty description tags', () => {
    const html = serverHead(<Head>{pageMetaTags({ title: 'T', description: null })}</Head>);

    expect(html).not.toContain('name="description"');
    expect(html).not.toContain('og:description');
    expect(count(html, 'property="og:title"')).toBe(1);
  });
});
