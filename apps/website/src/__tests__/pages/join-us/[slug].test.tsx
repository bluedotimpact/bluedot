import {
  describe, expect, test, beforeEach, vi,
} from 'vitest';
import { JobPosting } from '@bluedot/db';
import JobPostingPage from '../../../pages/join-us/[slug]';
import { renderWithHead } from '../../testUtils';

// Mock <Head>, which doesn't work in tests. See docstring of
// `renderWithHead` for more details.
vi.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => {
    if (typeof window !== 'undefined' && children) {
      return (
        <head-proxy data-testid="head-proxy">
          {children}
        </head-proxy>
      );
    }
    return null;
  },
}));

const mockJob: JobPosting = {
  id: 'recJob123',
  title: 'AI Safety Researcher',
  slug: 'ai-safety-researcher',
  subtitle: 'Join our research team',
  body: '# About the role\n\nWe are looking for researchers...',
  applicationUrl: 'https://example.com/apply',
  publishedAt: 1609459200,
  publicationStatus: 'Published',
};

describe('JobPostingPage SSR/SEO', () => {
  beforeEach(() => {
    // Required for `renderWithHead`
    document.head.innerHTML = '';
  });

  test('renders SEO meta tags during SSR without API calls', () => {
    renderWithHead(
      <JobPostingPage
        slug="ai-safety-researcher"
        job={mockJob}
      />,
    );

    expect(document.title).toBe('AI Safety Researcher | BlueDot Impact');

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('Join our research team');

    const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
    expect(jsonLdScript).toBeTruthy();

    if (jsonLdScript?.textContent) {
      const structuredData = JSON.parse(jsonLdScript.textContent);
      expect(structuredData['@type']).toBe('JobPosting');
      expect(structuredData.title).toBe('AI Safety Researcher');
      expect(structuredData.hiringOrganization.name).toBe('BlueDot Impact');
    }
  });
});
