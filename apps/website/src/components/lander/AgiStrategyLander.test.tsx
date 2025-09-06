import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgiStrategyLander from './AgiStrategyLander';

// Mock Next.js Head component
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock child components that might have complex dependencies
vi.mock('../homepage/GraduateSection', () => ({
  default: () => <div data-testid="graduate-section">Graduate Section</div>,
}));

vi.mock('../homepage/CommunitySection/TestimonialSubSection', () => ({
  default: ({ testimonials, title }: { testimonials?: unknown[]; title: string }) => (
    <div data-testid="testimonial-section">
      <h2>{title}</h2>
      {testimonials?.length && <span>Testimonials: {testimonials.length}</span>}
    </div>
  ),
  Testimonial: {},
}));

vi.mock('../courses/MarkdownExtendedRenderer', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="markdown-content">{children}</div>
  ),
}));

describe('AgiStrategyLander', () => {
  it('renders the complete page correctly (snapshot)', () => {
    const { container } = render(<AgiStrategyLander />);
    expect(container).toMatchSnapshot();
  });

  it('renders HeroSection with correct props', () => {
    render(<AgiStrategyLander />);

    // Check title - use getAllByText since it appears multiple times
    const titleElements = screen.getAllByText(/AGI Strategy/);
    expect(titleElements.length).toBeGreaterThan(0);

    // Check description
    expect(screen.getByText(/Artificial General Intelligence is moving from research to reality/)).toBeInTheDocument();

    // Check metadata
    expect(screen.getByText('30 hours')).toBeInTheDocument();
    expect(screen.getByText('Verified certificate')).toBeInTheDocument();
    expect(screen.getByText('Beginner-friendly')).toBeInTheDocument();

    // Check CTAs - use getAllByRole since there might be multiple
    const applyButtons = screen.getAllByRole('link', { name: /Apply now/i });
    expect(applyButtons.length).toBeGreaterThan(0);
  });

  it('renders Graduate section', () => {
    render(<AgiStrategyLander />);
    expect(screen.getByTestId('graduate-section')).toBeInTheDocument();
  });

  it('renders course content with markdown', () => {
    render(<AgiStrategyLander />);

    const markdownContent = screen.getByTestId('markdown-content');
    expect(markdownContent).toBeInTheDocument();

    // Check for key content sections
    expect(screen.getByText(/What is AGI\?/)).toBeInTheDocument();
    expect(screen.getByText(/Who we are/)).toBeInTheDocument();
    expect(screen.getByText(/Logistics made simple/)).toBeInTheDocument();
  });

  it('renders testimonials section', () => {
    render(<AgiStrategyLander />);

    const testimonialSection = screen.getByTestId('testimonial-section');
    expect(testimonialSection).toBeInTheDocument();
    expect(screen.getByText('What people say about us')).toBeInTheDocument();
    expect(screen.getByText('Testimonials: 3')).toBeInTheDocument();
  });

  it('renders AGI Strategy banner with CTA', () => {
    render(<AgiStrategyLander />);

    expect(
      screen.getByText("Join our AGI Strategy Course and become a leader in shaping humanity's AI future."),
    ).toBeInTheDocument();
  });

  it('has correct meta tags in Head', () => {
    const { container } = render(<AgiStrategyLander />);

    // Since Head is mocked, we can at least verify the component renders
    // In a real test environment with Next.js testing utils, we could check actual meta tags
    const titleElement = container.querySelector('title');
    expect(titleElement).toBeTruthy();
    expect(titleElement?.textContent).toBe('AGI Strategy Course | BlueDot Impact');
  });
});
