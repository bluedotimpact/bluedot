import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseLander from './CourseLander';
import { createAgiStrategyContent } from './course-content/AgiStrategyContent';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';

// Test URL - in production this comes from the database
const TEST_APPLICATION_URL = 'https://web.miniextensions.com/test';

// Mock Next.js Head component
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/courses/agi-strategy',
    query: {},
    asPath: '/courses/agi-strategy',
  }),
}));

// Mock @bluedot/ui hooks
vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    useLatestUtmParams: () => ({
      latestUtmParams: { utm_source: undefined },
    }),
  };
});

// Mock child components that might have complex dependencies
vi.mock('./components/GraduateSection', () => ({
  default: () => <div data-testid="graduate-section">Graduate Section</div>,
}));

vi.mock('./TestimonialCarousel', () => ({
  default: ({ testimonials, title }: { testimonials?: unknown[]; title?: string }) => (
    <div data-testid="community-members-section">
      {title && <h2>{title}</h2>}
      {testimonials?.length && <span>Testimonials: {testimonials.length}</span>}
    </div>
  ),
  TestimonialMember: {},
}));

describe('AgiStrategyLander', () => {
  beforeEach(() => {
    server.use(trpcMsw.testimonials.getCommunityMembersByCourseSlug.query(() => [
      {
        name: 'Test Person 1', jobTitle: 'Job 1', imageSrc: 'https://example.com/1.jpg', url: 'https://example.com/1', quote: 'Quote 1',
      },
      {
        name: 'Test Person 2', jobTitle: 'Job 2', imageSrc: 'https://example.com/2.jpg', url: 'https://example.com/2', quote: 'Quote 2',
      },
      {
        name: 'Test Person 3', jobTitle: 'Job 3', imageSrc: 'https://example.com/3.jpg', url: 'https://example.com/3', quote: 'Quote 3',
      },
      {
        name: 'Test Person 4', jobTitle: 'Job 4', imageSrc: 'https://example.com/4.jpg', url: 'https://example.com/4', quote: 'Quote 4',
      },
    ]));
  });

  it('renders the complete page correctly (snapshot)', () => {
    const { container } = render(
      <CourseLander
        courseSlug="agi-strategy"
        baseApplicationUrl={TEST_APPLICATION_URL}
        createContentFor={createAgiStrategyContent}
        courseOgImage="https://bluedot.org/images/courses/link-preview/agi-strategy.png"
        soonestDeadline={null}
      />,
      { wrapper: TrpcProvider },
    );
    expect(container).toMatchSnapshot();
  });

  it('renders HeroSection with correct props', () => {
    render(
      <CourseLander
        courseSlug="agi-strategy"
        baseApplicationUrl={TEST_APPLICATION_URL}
        createContentFor={createAgiStrategyContent}
        courseOgImage="https://bluedot.org/images/courses/link-preview/agi-strategy.png"
        soonestDeadline={null}
      />,
      { wrapper: TrpcProvider },
    );

    // Check title - appears in HeroSection title
    expect(screen.getAllByText('AGI Strategy').length).toBeGreaterThan(0);

    // Check description includes the key content
    expect(screen.getAllByText(/Start here/).length).toBeGreaterThan(0);

    // Check that at least one "Apply now" CTA exists
    expect(screen.getAllByRole('link', { name: /Apply now/i }).length).toBeGreaterThan(0);
  });

  it('renders Graduate section', () => {
    render(
      <CourseLander
        courseSlug="agi-strategy"
        baseApplicationUrl={TEST_APPLICATION_URL}
        createContentFor={createAgiStrategyContent}
        courseOgImage="https://bluedot.org/images/courses/link-preview/agi-strategy.png"
        soonestDeadline={null}
      />,
      { wrapper: TrpcProvider },
    );
    expect(screen.getByTestId('graduate-section')).toBeInTheDocument();
  });

  it('renders community members section', async () => {
    render(
      <CourseLander
        courseSlug="agi-strategy"
        baseApplicationUrl={TEST_APPLICATION_URL}
        createContentFor={createAgiStrategyContent}
        courseOgImage="https://bluedot.org/images/courses/link-preview/agi-strategy.png"
        soonestDeadline={null}
      />,
      { wrapper: TrpcProvider },
    );

    await waitFor(() => {
      const communityMembersSection = screen.getByTestId('community-members-section');
      expect(communityMembersSection).toBeInTheDocument();
    });
  });

  it('renders AGI Strategy banner with CTA', () => {
    render(
      <CourseLander
        courseSlug="agi-strategy"
        baseApplicationUrl={TEST_APPLICATION_URL}
        createContentFor={createAgiStrategyContent}
        courseOgImage="https://bluedot.org/images/courses/link-preview/agi-strategy.png"
        soonestDeadline={null}
      />,
      { wrapper: TrpcProvider },
    );

    // Check that the banner section exists and contains the expected text
    expect(screen.getByText('Start building towards a good future today')).toBeInTheDocument();
  });

  it('has correct meta tags in Head', () => {
    const { container } = render(
      <CourseLander
        courseSlug="agi-strategy"
        baseApplicationUrl={TEST_APPLICATION_URL}
        createContentFor={createAgiStrategyContent}
        courseOgImage="https://bluedot.org/images/courses/link-preview/agi-strategy.png"
        soonestDeadline={null}
      />,
      { wrapper: TrpcProvider },
    );

    // Since Head is mocked, we can at least verify the component renders
    // In a real test environment with Next.js testing utils, we could check actual meta tags
    const titleElement = container.querySelector('title');
    expect(titleElement).toBeTruthy();
    expect(titleElement?.textContent).toBe('AGI Strategy Course | BlueDot Impact');
  });
});
