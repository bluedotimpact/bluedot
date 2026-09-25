import { render, screen } from '@testing-library/react';
import {
  describe, expect, test, beforeEach, vi,
} from 'vitest';
import { server, trpcMsw } from '../trpcMswSetup';
import { TrpcProvider } from '../trpcProvider';
import { renderWithHead } from '../testUtils';
import HomePage from '../../pages/index';

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
  useRouter: () => ({
    pathname: '/',
    query: {},
  }),
}));

describe('HomePage', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    server.use(trpcMsw.courses.getAll.query(() => []));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => []));
    server.use(trpcMsw.luma.getUpcomingEvents.query(() => []));
    server.use(trpcMsw.programs.getInPerson.query(() => []));
    server.use(trpcMsw.programs.getGrants.query(() => []));
    server.use(trpcMsw.grants.getRapidGrantStats.query(() => ({
      count: 0, totalAmountUsd: 0, averageHoursToDecision: null, p90DaysToDecision: null,
    })));
    server.use(trpcMsw.grants.getCareerTransitionGrantStats.query(() => ({
      count: 0, totalAmountUsd: 0, averageDaysToDecision: null,
    })));
  });

  test('temporarily hides community profiles while keeping action and event sections', async () => {
    server.use(trpcMsw.testimonials.getCommunityMembers.query(() => [
      {
        name: 'DB Person 1', jobTitle: 'Outdated role', imageSrc: 'https://example.com/1.jpg', url: 'https://example.com/1', quote: 'Quote 1', isPrioritised: false,
      },
    ]));

    render(<HomePage />, { wrapper: TrpcProvider });

    await screen.findByRole('link', { name: 'AI Security Bootcamp (opens in a new tab)' });
    expect(screen.queryByRole('heading', { name: 'Our community' })).toBeNull();
    expect(screen.queryByText('DB Person 1')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Turn knowledge into action' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Join an upcoming event' })).toBeTruthy();
  });

  test('sets homepage social metadata', async () => {
    renderWithHead(<TrpcProvider>
      <HomePage />
    </TrpcProvider>);

    expect(document.title).toBe('BlueDot Impact | Have a positive impact on the trajectory of AI');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Free online courses, grants, and intensive in-person programs from the leading talent accelerator for beneficial AI and societal resilience. Join 10,000+ alumni and start today.');
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('BlueDot Impact | Have a positive impact on the trajectory of AI');
    expect(document.querySelector('meta[name="twitter:description"]')?.getAttribute('content')).toBe('Free online courses, grants, and intensive in-person programs from the leading talent accelerator for beneficial AI and societal resilience. Join 10,000+ alumni and start today.');
  });
});
