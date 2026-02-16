import {
  describe, expect, test, beforeEach, vi,
} from 'vitest';
import { type Project } from '@bluedot/db';
import ProjectPostPage from '../../../pages/projects/[slug]';
import { renderWithHead } from '../../testUtils';

// Mock <Head>, which doesn't work in tests. See docstring of
// `renderWithHead` for more details.
vi.mock('next/head', () => ({
  __esModule: true,
  default({ children }: { children: React.ReactNode }) {
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

const mockProject: Project = {
  id: 'recProject123',
  title: 'AI Alignment Research Project',
  slug: 'ai-alignment-research',
  body: '# Project Overview\n\nThis project explores...',
  authorName: 'Alex Johnson',
  authorUrl: 'https://example.com/alex',
  course: 'AI Safety Fundamentals',
  tag: ['Research', 'Technical'],
  publishedAt: 1609459200,
  publicationStatus: 'Published',
} as Project;

describe('ProjectPostPage SSR/SEO', () => {
  beforeEach(() => {
    // Required for `renderWithHead`
    document.head.innerHTML = '';
  });

  test('renders SEO meta tags during SSR without API calls', () => {
    renderWithHead(<ProjectPostPage
      slug="ai-alignment-research"
      project={mockProject}
    />);

    expect(document.title).toBe('AI Alignment Research Project | BlueDot Impact');

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('AI Alignment Research Project - Project post by Alex Johnson');
  });
});
