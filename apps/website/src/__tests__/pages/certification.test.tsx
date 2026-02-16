import {
  describe, expect, test, beforeEach, vi,
} from 'vitest';
import { useAuthStore } from '@bluedot/ui';
import { useRouter } from 'next/router';
import CertificatePage from '../../pages/certification';
import { renderWithHead } from '../testUtils';
import { TrpcProvider } from '../trpcProvider';
import { server, trpcMsw } from '../trpcMswSetup';

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

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    useAuthStore: vi.fn(),
  };
});

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
    vi.mocked(useAuthStore).mockReturnValue(null);
    vi.mocked(useRouter).mockReturnValue({
      pathname: '/certification',
      asPath: '/certification',
    } as ReturnType<typeof useRouter>);
    server.use(trpcMsw.certificates.verifyOwnership.query(() => ({ isOwner: false })));
  });

  test('renders SEO meta tags during SSR without API calls', () => {
    renderWithHead(<TrpcProvider>
      <CertificatePage
        certificate={mockCertificate}
        certificateId="cert123"
        linkPreviewFilename="link-preview-image.png"
        nextCohortText={null}
      />
    </TrpcProvider>);

    expect(document.title).toBe('Jane Smith has completed AI Safety Fundamentals | BlueDot Impact');

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('Has successfully completed the course');

    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage?.getAttribute('content')).toContain('/images/certificates/link-preview/link-preview-image.png');

    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    expect(twitterImage?.getAttribute('content')).toContain('/images/certificates/link-preview/link-preview-image.png');
  });
});
