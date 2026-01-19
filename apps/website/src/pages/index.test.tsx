import { render, screen, waitFor } from '@testing-library/react';
import {
  describe, expect, test, beforeEach, vi,
} from 'vitest';
import type { Testimonial } from '@bluedot/db';
import { server, trpcMsw } from '../__tests__/trpcMswSetup';
import { TrpcProvider } from '../__tests__/trpcProvider';
import HomePage from './index';

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    query: {},
  }),
}));

const createTestimonial = (overrides: Partial<Testimonial>): Testimonial => ({
  id: 'test-id',
  name: 'Test Name',
  testimonialText: 'Test quote',
  headshotAttachmentUrls: ['https://example.com/photo.jpg'],
  jobTitle: 'Test Role',
  bluedotEngagement: 'Test Course',
  profileUrl: 'https://example.com/profile',
  displayOnCourseSlugs: [],
  isPrioritised: false,
  ...overrides,
});

describe('HomePage testimonials', () => {
  beforeEach(() => {
    server.use(trpcMsw.courses.getAll.query(() => []));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => []));
    server.use(trpcMsw.luma.getUpcomingEvents.query(() => []));
    server.use(trpcMsw.blogs.getAll.query(() => []));
    server.use(trpcMsw.blogs.getSubstack.query(() => []));
  });

  test('shows fallback community members when fewer than 4 testimonials', async () => {
    server.use(trpcMsw.testimonials.getCommunityMembers.query(() => [
      createTestimonial({ name: 'DB Person 1' }),
      createTestimonial({ name: 'DB Person 2' }),
    ]));

    render(<HomePage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getAllByText('Neel Nanda').length).toBeGreaterThan(0);
    });
  });

  test('shows database testimonials when 4 or more exist', async () => {
    server.use(trpcMsw.testimonials.getCommunityMembers.query(() => [
      createTestimonial({ name: 'DB Person 1', isPrioritised: true }),
      createTestimonial({ name: 'DB Person 2' }),
      createTestimonial({ name: 'DB Person 3' }),
      createTestimonial({ name: 'DB Person 4' }),
    ]));

    render(<HomePage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getAllByText('DB Person 1').length).toBeGreaterThan(0);
    });

    expect(screen.queryAllByText('Neel Nanda')).toHaveLength(0);
  });

});
