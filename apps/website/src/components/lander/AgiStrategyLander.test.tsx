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
vi.mock('./agi-strategy/GraduateSection', () => ({
  default: () => <div data-testid="graduate-section">Graduate Section</div>,
}));

vi.mock('./agi-strategy/TestimonialSubSection', () => ({
  default: ({ testimonials, title }: { testimonials?: unknown[]; title: string }) => (
    <div data-testid="testimonial-section">
      <h2>{title}</h2>
      {testimonials?.length && <span>Testimonials: {testimonials.length}</span>}
    </div>
  ),
  Testimonial: {},
}));

vi.mock('./agi-strategy/CommunityMembersSubSection', () => ({
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
    const { container } = render(<AgiStrategyLander />);
    expect(container).toMatchSnapshot();
  });

  it('renders HeroSection with correct props', () => {
    render(<AgiStrategyLander />);

    // Check title - appears in HeroSection title and page title
    const titleText = 'Start building the defences that protect humanity';
    expect(screen.getByText(titleText)).toBeInTheDocument();

    // Check description
    expect(screen.getByText(/Envision a good future. Map the threats from AI. Design effective interventions. Get funded to start shipping. All in 30 hours./)).toBeInTheDocument();

    // Check CTAs - "Apply now" appears in HeroSection, CourseDetailsSection, and banner (3 times total)
    const applyButtons = screen.getAllByRole('link', { name: /Apply now/i });
    expect(applyButtons).toHaveLength(3);
  });

  it('renders Graduate section', () => {
    render(<AgiStrategyLander />);
    expect(screen.getByTestId('graduate-section')).toBeInTheDocument();
  });

  it('renders community members section', () => {
    render(<AgiStrategyLander />);

    const communityMembersSection = screen.getByTestId('community-members-section');
    expect(communityMembersSection).toBeInTheDocument();
    // Check if the component is rendered - text check removed as the title is now optional
  });

  it('renders AGI Strategy banner with CTA', () => {
    render(<AgiStrategyLander />);

    // Check that the banner section exists and contains the expected text
    expect(screen.getByText('Start building towards a good future today')).toBeInTheDocument();
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
