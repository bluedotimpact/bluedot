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

  test('gives link previews the mission title and subtitle', () => {
    renderWithHead(<TrpcProvider>
      <MissionPostPage slug="ai-safety-eval-harness" mission={mockMission} />
    </TrpcProvider>);

    const content = (selector: string) => document.querySelector(selector)?.getAttribute('content');
    expect(content('meta[property="og:title"]')).toBe('Open-source AI safety eval harness | BlueDot Impact');
    expect(content('meta[name="twitter:title"]')).toBe('Open-source AI safety eval harness | BlueDot Impact');
    expect(content('meta[property="og:description"]')).toBe(mockMission.subtitle);
    expect(content('meta[name="twitter:description"]')).toBe(mockMission.subtitle);
  });

  test('leaves out description tags when the mission has no subtitle', () => {
    renderWithHead(<TrpcProvider>
      <MissionPostPage slug="ai-safety-eval-harness" mission={{ ...mockMission, subtitle: null }} />
    </TrpcProvider>);

    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content'))
      .toBe('Open-source AI safety eval harness | BlueDot Impact');
    expect(document.querySelector('meta[name="description"]')).toBeNull();
    expect(document.querySelector('meta[property="og:description"]')).toBeNull();
    expect(document.querySelector('meta[name="twitter:description"]')).toBeNull();
  });
});
