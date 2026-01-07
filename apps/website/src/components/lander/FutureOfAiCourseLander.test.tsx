import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseLander from './CourseLander';
import { createFutureOfAiContent, FUTURE_OF_AI_START_URL } from './course-content/FutureOfAiContent';
import { TrpcProvider } from '../../__tests__/trpcProvider';

// Mock Next.js Head component
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/courses/future-of-ai',
    query: {},
    asPath: '/courses/future-of-ai',
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

describe('FutureOfAiCourseLander (new CourseLander version)', () => {
  it('renders the complete page correctly (snapshot)', () => {
    const { container } = render(
      <CourseLander
        courseSlug="future-of-ai"
        baseApplicationUrl={FUTURE_OF_AI_START_URL}
        createContentFor={createFutureOfAiContent}
        courseOgImage="https://bluedot.org/images/courses/link-preview/future-of-ai.png"
      />,
      { wrapper: TrpcProvider },
    );
    expect(container).toMatchSnapshot();
  });

  it('renders HeroSection with correct props', () => {
    render(
      <CourseLander
        courseSlug="future-of-ai"
        baseApplicationUrl={FUTURE_OF_AI_START_URL}
        createContentFor={createFutureOfAiContent}
      />,
      { wrapper: TrpcProvider },
    );

    expect(screen.getAllByText('The Future of AI').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/An introduction to what AI can do today/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Start the free course/i }).length).toBeGreaterThan(0);
  });

  it('renders Graduate section', () => {
    render(
      <CourseLander
        courseSlug="future-of-ai"
        baseApplicationUrl={FUTURE_OF_AI_START_URL}
        createContentFor={createFutureOfAiContent}
      />,
      { wrapper: TrpcProvider },
    );
    expect(screen.getByTestId('graduate-section')).toBeInTheDocument();
  });

  it('renders quote section with Future of AI-specific colors', () => {
    const { container } = render(
      <CourseLander
        courseSlug="future-of-ai"
        baseApplicationUrl={FUTURE_OF_AI_START_URL}
        createContentFor={createFutureOfAiContent}
      />,
      { wrapper: TrpcProvider },
    );

    // Check that the quote section exists with the Future of AI cream background color
    const quoteCard = container.querySelector('[style*="background-color: #faf6e1"]');
    expect(quoteCard).toBeInTheDocument();
  });

  it('renders course benefits with Future of AI-specific icon colors', () => {
    const { container } = render(
      <CourseLander
        courseSlug="future-of-ai"
        baseApplicationUrl={FUTURE_OF_AI_START_URL}
        createContentFor={createFutureOfAiContent}
      />,
      { wrapper: TrpcProvider },
    );

    // Check that the icon background uses the Future of AI cream color
    const iconBackground = container.querySelector('[style*="background-color: #faf6e1"]');
    expect(iconBackground).toBeInTheDocument();
  });

  it('renders Future of AI banner with CTA', () => {
    render(
      <CourseLander
        courseSlug="future-of-ai"
        baseApplicationUrl={FUTURE_OF_AI_START_URL}
        createContentFor={createFutureOfAiContent}
      />,
      { wrapper: TrpcProvider },
    );

    expect(screen.getByText("Start understanding AI's future today")).toBeInTheDocument();
  });

  it('has correct meta tags in Head', () => {
    const { container } = render(
      <CourseLander
        courseSlug="future-of-ai"
        baseApplicationUrl={FUTURE_OF_AI_START_URL}
        createContentFor={createFutureOfAiContent}
      />,
      { wrapper: TrpcProvider },
    );

    const titleElement = container.querySelector('title');
    expect(titleElement).toBeTruthy();
    expect(titleElement?.textContent).toBe('Future of AI Course | BlueDot Impact');
  });
});
