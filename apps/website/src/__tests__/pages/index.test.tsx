import { render, screen, waitFor } from '@testing-library/react';
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

describe('HomePage testimonials', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    server.use(trpcMsw.courses.getAll.query(() => []));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => []));
    server.use(trpcMsw.luma.getUpcomingEvents.query(() => []));
  });

  test('shows database testimonials', async () => {
    server.use(trpcMsw.testimonials.getCommunityMembers.query(() => [
      {
        name: 'DB Person 1', jobTitle: 'Job 1', imageSrc: 'https://example.com/1.jpg', url: 'https://example.com/1', quote: 'Quote 1',
      },
      {
        name: 'DB Person 2', jobTitle: 'Job 2', imageSrc: 'https://example.com/2.jpg', url: 'https://example.com/2', quote: 'Quote 2',
      },
      {
        name: 'DB Person 3', jobTitle: 'Job 3', imageSrc: 'https://example.com/3.jpg', url: 'https://example.com/3', quote: 'Quote 3',
      },
      {
        name: 'DB Person 4', jobTitle: 'Job 4', imageSrc: 'https://example.com/4.jpg', url: 'https://example.com/4', quote: 'Quote 4',
      },
    ]));

    render(<HomePage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getAllByText('DB Person 1').length).toBeGreaterThan(0);
    });
  });

  test('sets homepage social metadata', async () => {
    server.use(trpcMsw.testimonials.getCommunityMembers.query(() => []));

    renderWithHead(<TrpcProvider>
      <HomePage />
    </TrpcProvider>);

    expect(document.title).toBe('BlueDot Impact | Have a positive impact on the trajectory of AI');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Free courses, career support, and entrepreneur programs from the leading talent accelerator for beneficial AI and societal resilience. Join 7,000+ alumni and start today.');
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('BlueDot Impact | Have a positive impact on the trajectory of AI');
    expect(document.querySelector('meta[name="twitter:description"]')?.getAttribute('content')).toBe('Free courses, career support, and entrepreneur programs from the leading talent accelerator for beneficial AI and societal resilience. Join 7,000+ alumni and start today.');
  });
});
