import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseLander from './CourseLander';
import { createAiGovernanceContent, AI_GOVERNANCE_APPLICATION_URL } from './course-content/AiGovernanceContent';
import { TrpcProvider } from '../../__tests__/trpcProvider';

// Mock Next.js Head component
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/courses/ai-governance',
    query: {},
    asPath: '/courses/ai-governance',
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

describe('AiGovernanceLander', () => {
  it('renders the complete page correctly (snapshot)', () => {
    const { container } = render(
      <CourseLander
        courseSlug="ai-governance"
        baseApplicationUrl={AI_GOVERNANCE_APPLICATION_URL}
        createContentFor={createAiGovernanceContent}
        courseOgImage="https://bluedot.org/images/courses/link-preview/ai-governance.png"
      />,
      { wrapper: TrpcProvider },
    );
    expect(container).toMatchSnapshot();
  });

  it('renders HeroSection with correct props', () => {
    render(
      <CourseLander
        courseSlug="ai-governance"
        baseApplicationUrl={AI_GOVERNANCE_APPLICATION_URL}
        createContentFor={createAiGovernanceContent}
      />,
      { wrapper: TrpcProvider },
    );

    expect(screen.getAllByText('AI Governance').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Learn about the policy landscape/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Apply now/i }).length).toBeGreaterThan(0);
  });

  it('renders Graduate section', () => {
    render(
      <CourseLander
        courseSlug="ai-governance"
        baseApplicationUrl={AI_GOVERNANCE_APPLICATION_URL}
        createContentFor={createAiGovernanceContent}
      />,
      { wrapper: TrpcProvider },
    );
    expect(screen.getByTestId('graduate-section')).toBeInTheDocument();
  });

  it('renders AI Governance banner with CTA', () => {
    render(
      <CourseLander
        courseSlug="ai-governance"
        baseApplicationUrl={AI_GOVERNANCE_APPLICATION_URL}
        createContentFor={createAiGovernanceContent}
      />,
      { wrapper: TrpcProvider },
    );

    expect(screen.getByText('Steer the future of AI today')).toBeInTheDocument();
  });

  it('has correct meta tags in Head', () => {
    const { container } = render(
      <CourseLander
        courseSlug="ai-governance"
        baseApplicationUrl={AI_GOVERNANCE_APPLICATION_URL}
        createContentFor={createAiGovernanceContent}
      />,
      { wrapper: TrpcProvider },
    );

    const titleElement = container.querySelector('title');
    expect(titleElement).toBeTruthy();
    expect(titleElement?.textContent).toBe('AI Governance Course | BlueDot Impact');
  });
});
