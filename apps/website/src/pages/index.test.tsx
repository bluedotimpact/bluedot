import { render, screen, waitFor } from '@testing-library/react';
import {
  describe, expect, test, beforeEach, vi,
} from 'vitest';
import { server, trpcMsw } from '../__tests__/trpcMswSetup';
import { TrpcProvider } from '../__tests__/trpcProvider';
import HomePage from './index';

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    query: {},
  }),
}));

describe('HomePage testimonials', () => {
  beforeEach(() => {
    server.use(trpcMsw.courses.getAll.query(() => []));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => []));
    server.use(trpcMsw.luma.getUpcomingEvents.query(() => []));
    server.use(trpcMsw.blogs.getAll.query(() => []));
    server.use(trpcMsw.blogs.getSubstack.query(() => []));
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
});
