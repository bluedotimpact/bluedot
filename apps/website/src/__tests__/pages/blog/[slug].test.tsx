import {
  describe, expect, test, beforeEach, vi,
} from 'vitest';
import { Blog } from '@bluedot/db';
import BlogPostPage from '../../../pages/blog/[slug]';
import { renderWithHead } from '../../testUtils';

// Mock <Head>, which doesn't work in tests. See docstring of
// `renderWithHead` for more details.
vi.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => {
    if (children) {
      return (
        <head-proxy data-testid="head-proxy">
          {children}
        </head-proxy>
      );
    }
    return null;
  },
}));

const mockBlog: Blog = {
  id: 'recBlog123',
  title: 'My Amazing Blog Post',
  slug: 'my-amazing-blog-post',
  body: '# Test Blog\n\nThis is test content.',
  authorName: 'John Doe',
  authorUrl: 'https://example.com/john',
  publishedAt: 1609459200,
  publicationStatus: 'Published',
  isFeatured: false,
};

describe('BlogPostPage SSR/SEO', () => {
  beforeEach(() => {
    // Required for `renderWithHead`
    document.head.innerHTML = '';
  });

  test('renders SEO meta tags during SSR without API calls', () => {
    renderWithHead(
      <BlogPostPage
        slug="my-amazing-blog-post"
        blog={mockBlog}
      />,
    );

    expect(document.title).toBe('My Amazing Blog Post | BlueDot Impact');

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('My Amazing Blog Post - Blog post by John Doe');

    // Check Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle?.getAttribute('content')).toBe('My Amazing Blog Post');

    const ogDescription = document.querySelector('meta[property="og:description"]');
    expect(ogDescription?.getAttribute('content')).toBe('My Amazing Blog Post');

    const ogType = document.querySelector('meta[property="og:type"]');
    expect(ogType?.getAttribute('content')).toBe('article');

    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage?.getAttribute('content')).toBe('https://bluedot.org/images/logo/icon-on-blue.png');

    const ogUrl = document.querySelector('meta[property="og:url"]');
    expect(ogUrl?.getAttribute('content')).toBe('https://bluedot.org/blog/my-amazing-blog-post');

    // Check structured data
    const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
    expect(jsonLdScript).toBeTruthy();

    if (jsonLdScript?.textContent) {
      const structuredData = JSON.parse(jsonLdScript.textContent);
      expect(structuredData['@type']).toBe('BlogPosting');
      expect(structuredData.headline).toBe('My Amazing Blog Post');
      expect(structuredData.author.name).toBe('John Doe');
      expect(structuredData.datePublished).toBe('2021-01-01T00:00:00.000Z');
    }
  });
});
