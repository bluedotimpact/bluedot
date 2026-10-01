import {
  beforeEach, describe, expect, test, vi, type Mock,
} from 'vitest';
import { useRouter } from 'next/router';
import AboutPage from '../../pages/about';
import AttendancePolicyPage from '../../pages/attendance-policy';
import CodeOfConductPage from '../../pages/code-of-conduct';
import ContactPage from '../../pages/contact';
import PrivacyPolicyPage from '../../pages/privacy-policy';
import ProgramsPage from '../../pages/programs';
import { renderWithHead } from '../testUtils';
import { TrpcProvider } from '../trpcProvider';

// Mock <Head>, which doesn't work in tests. See docstring of
// `renderWithHead` for more details.
vi.mock('next/head', () => ({
  __esModule: true,
  default({ children }: { children: React.ReactNode }) {
    if (children) {
      return <head-proxy data-testid="head-proxy">{children}</head-proxy>;
    }

    return null;
  },
}));

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

const content = (selector: string) => document.querySelector(selector)?.getAttribute('content');

describe('public pages give link previews their own title and description', () => {
  beforeEach(() => {
    // Required for `renderWithHead`
    document.head.innerHTML = '';
  });

  test.each([
    ['/about', AboutPage],
    ['/attendance-policy', AttendancePolicyPage],
    ['/code-of-conduct', CodeOfConductPage],
    ['/contact', ContactPage],
    ['/privacy-policy', PrivacyPolicyPage],
    ['/programs', ProgramsPage],
  ])('%s', (path, Page) => {
    (useRouter as unknown as Mock).mockReturnValue({ asPath: path, pathname: path, push: vi.fn() });

    renderWithHead(<TrpcProvider><Page /></TrpcProvider>);

    const description = content('meta[name="description"]');
    expect(document.title).toMatch(/\S/);
    expect(description).toMatch(/\S/);
    expect(content('meta[property="og:title"]')).toBe(document.title);
    expect(content('meta[name="twitter:title"]')).toBe(document.title);
    expect(content('meta[property="og:description"]')).toBe(description);
    expect(content('meta[name="twitter:description"]')).toBe(description);
  });
});
