import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseLander from './CourseLander';
import { createAgiStrategyContent, AGI_STRATEGY_APPLICATION_URL } from './course-content/AgiStrategyContent';
import { TrpcProvider } from '../../__tests__/trpcProvider';

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

describe('AgiStrategyLander', () => {
  it('renders the complete page correctly (snapshot)', () => {
    const { container } = render(
      <CourseLander
        courseSlug="agi-strategy"
        baseApplicationUrl={AGI_STRATEGY_APPLICATION_URL}
        createContentFor={createAgiStrategyContent}
        courseOgImage="https://bluedot.org/images/courses/link-preview/agi-strategy.png"
      />,
      { wrapper: TrpcProvider },
    );
    expect(container).toMatchSnapshot();
  });

  it('renders HeroSection with correct props', () => {
    render(
      <CourseLander
        courseSlug="agi-strategy"
        baseApplicationUrl={AGI_STRATEGY_APPLICATION_URL}
        createContentFor={createAgiStrategyContent}
      />,
      { wrapper: TrpcProvider },
    );

    // Check title - appears in HeroSection title and page title
    const titleText = 'Start building the defences that protect humanity';
    expect(screen.getByText(titleText)).toBeInTheDocument();

    // Check description
    expect(screen.getByText(/Envision a good future. Map the threats from AI. Design effective interventions. Get funded to start shipping. All in 30 hours./)).toBeInTheDocument();

    // Check CTAs - "Apply now" appears in HeroSection, WhoIsThisForSection, and banner (3 times total)
    // CourseInformationSection shows loading state since it's fetching schedule data
    const applyButtons = screen.getAllByRole('link', { name: /Apply now/i });
    expect(applyButtons).toHaveLength(3);
  });

  it('renders Graduate section', () => {
    render(
      <CourseLander
        courseSlug="agi-strategy"
        baseApplicationUrl={AGI_STRATEGY_APPLICATION_URL}
        createContentFor={createAgiStrategyContent}
      />,
      { wrapper: TrpcProvider },
    );
    expect(screen.getByTestId('graduate-section')).toBeInTheDocument();
  });

  it('renders community members section', () => {
    render(
      <CourseLander
        courseSlug="agi-strategy"
        baseApplicationUrl={AGI_STRATEGY_APPLICATION_URL}
        createContentFor={createAgiStrategyContent}
      />,
      { wrapper: TrpcProvider },
    );

    const communityMembersSection = screen.getByTestId('community-members-section');
    expect(communityMembersSection).toBeInTheDocument();
  });

  it('renders AGI Strategy banner with CTA', () => {
    render(
      <CourseLander
        courseSlug="agi-strategy"
        baseApplicationUrl={AGI_STRATEGY_APPLICATION_URL}
        createContentFor={createAgiStrategyContent}
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
        baseApplicationUrl={AGI_STRATEGY_APPLICATION_URL}
        createContentFor={createAgiStrategyContent}
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
