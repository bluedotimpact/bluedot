import {
  describe, expect, test, beforeEach, vi, type Mock,
} from 'vitest';
import { useRouter } from 'next/router';
import { type Mission } from '@bluedot/db';
import MissionPostPage from '../../../pages/missions/[slug]';
import { renderWithHead } from '../../testUtils';
import { TrpcProvider } from '../../trpcProvider';

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

const mockRouter = {
  asPath: '/missions/ai-safety-eval-harness',
  pathname: '/missions/[slug]',
  push: vi.fn(),
};

const mockMission: Mission = {
  id: 'recMission123',
  title: 'Open-source AI safety eval harness',
  subtitle: 'A reusable rig for benchmarking dangerous capabilities',
  slug: 'ai-safety-eval-harness',
  description: '# Overview\n\nWe want a tool that...',
  status: 'Live',
};

describe('MissionPostPage SSR/SEO', () => {
  beforeEach(() => {
    // Required for `renderWithHead`
    document.head.innerHTML = '';
    (useRouter as unknown as Mock).mockReturnValue(mockRouter);
  });

  test('renders SEO meta tags during SSR without API calls', () => {
    renderWithHead(<TrpcProvider>
      <MissionPostPage
        slug="ai-safety-eval-harness"
        mission={mockMission}
      />
    </TrpcProvider>);

    expect(document.title).toBe('Open-source AI safety eval harness | BlueDot Impact');

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe(mockMission.subtitle);
  });
});
