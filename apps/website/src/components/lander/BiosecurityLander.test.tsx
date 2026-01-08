import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseLander from './CourseLander';
import { createBioSecurityContent, BIOSECURITY_APPLICATION_URL } from './course-content/BiosecurityContent';
import { TrpcProvider } from '../../__tests__/trpcProvider';

// Mock Next.js Head component
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/courses/biosecurity',
    query: {},
    asPath: '/courses/biosecurity',
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

describe('BiosecurityLander', () => {
  it('renders the complete page correctly (snapshot)', () => {
    const { container } = render(
      <CourseLander
        courseSlug="biosecurity"
        baseApplicationUrl={BIOSECURITY_APPLICATION_URL}
        createContentFor={createBioSecurityContent}
        courseOgImage="https://bluedot.org/images/courses/link-preview/biosecurity.png"
      />,
      { wrapper: TrpcProvider },
    );
    expect(container).toMatchSnapshot();
  });

  it('renders HeroSection with correct props', () => {
    render(
      <CourseLander
        courseSlug="biosecurity"
        baseApplicationUrl={BIOSECURITY_APPLICATION_URL}
        createContentFor={createBioSecurityContent}
      />,
      { wrapper: TrpcProvider },
    );

    expect(screen.getAllByText('Biosecurity').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Start building towards a pandemic-proof world/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Apply now/i }).length).toBeGreaterThan(0);
  });

  it('renders Graduate section', () => {
    render(
      <CourseLander
        courseSlug="biosecurity"
        baseApplicationUrl={BIOSECURITY_APPLICATION_URL}
        createContentFor={createBioSecurityContent}
      />,
      { wrapper: TrpcProvider },
    );
    expect(screen.getByTestId('graduate-section')).toBeInTheDocument();
  });

  it('renders community members section with custom title', () => {
    render(
      <CourseLander
        courseSlug="biosecurity"
        baseApplicationUrl={BIOSECURITY_APPLICATION_URL}
        createContentFor={createBioSecurityContent}
      />,
      { wrapper: TrpcProvider },
    );

    const communityMembersSection = screen.getByTestId('community-members-section');
    expect(communityMembersSection).toBeInTheDocument();
  });

  it('renders Biosecurity banner with CTA', () => {
    render(
      <CourseLander
        courseSlug="biosecurity"
        baseApplicationUrl={BIOSECURITY_APPLICATION_URL}
        createContentFor={createBioSecurityContent}
      />,
      { wrapper: TrpcProvider },
    );

    expect(screen.getByText('Start building a pandemic-proof world today')).toBeInTheDocument();
  });

  it('renders quote section with biosecurity-specific colors', () => {
    const { container } = render(
      <CourseLander
        courseSlug="biosecurity"
        baseApplicationUrl={BIOSECURITY_APPLICATION_URL}
        createContentFor={createBioSecurityContent}
      />,
      { wrapper: TrpcProvider },
    );

    // Check that the quote section exists with the biosecurity green background color
    const quoteCard = container.querySelector('[style*="background-color: #e5faea"]');
    expect(quoteCard).toBeInTheDocument();
  });

  it('has correct meta tags in Head', () => {
    const { container } = render(
      <CourseLander
        courseSlug="biosecurity"
        baseApplicationUrl={BIOSECURITY_APPLICATION_URL}
        createContentFor={createBioSecurityContent}
      />,
      { wrapper: TrpcProvider },
    );

    const titleElement = container.querySelector('title');
    expect(titleElement).toBeTruthy();
    expect(titleElement?.textContent).toBe('Biosecurity Course | BlueDot Impact');
  });
});
