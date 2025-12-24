import {
  describe, expect, test, beforeEach, vi,
} from 'vitest';
import CertificatePage from '../../pages/certification';
import { renderWithHead } from '../testUtils';

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

const mockCertificate = {
  certificateId: 'cert123',
  certificateCreatedAt: 1609459200,
  recipientName: 'Jane Smith',
  courseName: 'AI Safety Fundamentals',
  courseSlug: 'ai-safety-fundamentals',
  certificationDescription: 'Has successfully completed the course',
  courseDetailsUrl: 'https://example.com/course',
};

describe('CertificatePage SSR/SEO', () => {
  beforeEach(() => {
    // Required for `renderWithHead`
    document.head.innerHTML = '';
  });

  test('renders SEO meta tags during SSR without API calls', () => {
    renderWithHead(
      <CertificatePage
        certificate={mockCertificate}
        certificateId="cert123"
        certificationBadgeFilename="ai-safety-fundamentals.png"
      />,
    );

    expect(document.title).toBe('Jane Smith has completed AI Safety Fundamentals | BlueDot Impact');

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('Has successfully completed the course');
  });
});
