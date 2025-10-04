import {
  describe, expect, test, beforeEach, vi,
} from 'vitest';
import CertificatePage from '../../pages/certification';
import { renderWithHead } from '../testUtils';
import { Certificate } from '../../pages/api/certificates/[certificateId]';

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

const mockCertificate: Certificate = {
  certificateId: 'cert123',
  certificateCreatedAt: 1609459200,
  recipientName: 'Jane Smith',
  courseName: 'AI Safety Fundamentals',
  certificationDescription: 'Has successfully completed the course',
  certificationBadgeImageSrc: 'https://example.com/badge.svg',
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
      />,
    );

    expect(document.title).toBe("Jane Smith's Certificate | BlueDot Impact");

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('Certificate of completion for AI Safety Fundamentals');
  });
});
