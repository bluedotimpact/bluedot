import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseLander from './CourseLander';
import { createIncubatorWeekContent } from './course-content/IncubatorWeekContent';
import { TrpcProvider } from '../../__tests__/trpcProvider';

// Test URL - in production this comes from the database
const TEST_APPLICATION_URL = 'https://web.miniextensions.com/test';

// Mock Next.js Head component
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/courses/incubator-week',
    query: {},
    asPath: '/courses/incubator-week',
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

vi.mock('./components/TestimonialSubSection', () => ({
  default: ({ testimonials, title }: { testimonials?: unknown[]; title: string }) => (
    <div data-testid="testimonial-section">
      <h2>{title}</h2>
      {testimonials?.length && <span>Testimonials: {testimonials.length}</span>}
    </div>
  ),
  Testimonial: {},
}));

vi.mock('./CommunityCarousel', () => ({
  default: ({ members, title }: { members?: unknown[]; title?: string }) => (
    <div data-testid="community-members-section">
      {title && <h2>{title}</h2>}
      {members?.length && <span>Members: {members.length}</span>}
    </div>
  ),
  CommunityMember: {},
}));

describe('IncubatorWeekLander', () => {
  it('renders the complete page correctly (snapshot)', () => {
    const { container } = render(
      <CourseLander
        courseSlug="incubator-week"
        baseApplicationUrl={TEST_APPLICATION_URL}
        createContentFor={createIncubatorWeekContent}
        courseOgImage="https://bluedot.org/images/courses/link-preview/incubator-week.png"
        soonestDeadline={null}
      />,
      { wrapper: TrpcProvider },
    );
    expect(container).toMatchSnapshot();
  });

  it('renders HeroSection with correct props', () => {
    render(
      <CourseLander
        courseSlug="incubator-week"
        baseApplicationUrl={TEST_APPLICATION_URL}
        createContentFor={createIncubatorWeekContent}
        soonestDeadline={null}
      />,
      { wrapper: TrpcProvider },
    );

    // Check title - appears in HeroSection title
    expect(screen.getAllByText('Incubator Week').length).toBeGreaterThan(0);

    // Check description includes the key content
    expect(screen.getAllByText(/Training isn't enough/).length).toBeGreaterThan(0);

    // Check hiatus notice
    expect(screen.getAllByText(/Currently on hiatus/).length).toBeGreaterThan(0);

    // Check that at least one "Apply now" CTA exists
    expect(screen.getAllByRole('link', { name: /Apply now/i }).length).toBeGreaterThan(0);
  });

  it('renders Graduate section', () => {
    render(
      <CourseLander
        courseSlug="incubator-week"
        baseApplicationUrl={TEST_APPLICATION_URL}
        createContentFor={createIncubatorWeekContent}
        soonestDeadline={null}
      />,
      { wrapper: TrpcProvider },
    );
    expect(screen.getByTestId('graduate-section')).toBeInTheDocument();
  });

  it('renders Incubator Week banner with CTA', () => {
    render(
      <CourseLander
        courseSlug="incubator-week"
        baseApplicationUrl={TEST_APPLICATION_URL}
        createContentFor={createIncubatorWeekContent}
        soonestDeadline={null}
      />,
      { wrapper: TrpcProvider },
    );

    // Check that the banner section exists and contains the expected text
    expect(screen.getByText('Ready to build something that matters?')).toBeInTheDocument();
  });

  it('has correct meta tags in Head', () => {
    const { container } = render(
      <CourseLander
        courseSlug="incubator-week"
        baseApplicationUrl={TEST_APPLICATION_URL}
        createContentFor={createIncubatorWeekContent}
        soonestDeadline={null}
      />,
      { wrapper: TrpcProvider },
    );

    // Since Head is mocked, we can at least verify the component renders
    const titleElement = container.querySelector('title');
    expect(titleElement).toBeTruthy();
    expect(titleElement?.textContent).toBe('Incubator Week | BlueDot Impact');
  });
});
