import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HeroSection from './HeroSection';

describe('HeroSection', () => {
  const defaultProps = {
    title: "AGI Strategy – Learn how to navigate humanity's most critical decade",
    description: 'Artificial General Intelligence is moving from research to reality. Understand the race, the risks, and the strategic decisions that will shape economies, security, and our collective future.',
    primaryCta: {
      text: 'Apply now',
      url: 'https://example.com/apply',
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: '/courses/agi-strategy/1',
    },
  };

  it('renders correctly without visual component (snapshot)', () => {
    const { container } = render(<HeroSection {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });

  it('renders correctly with visual component (snapshot)', () => {
    const visualComponent = (
      <img
        src="/images/agi-strategy/hero-banner.png"
        alt="AGI Strategy visualization"
        className="size-full object-cover"
      />
    );

    const { container } = render(
      <HeroSection {...defaultProps} visualComponent={visualComponent} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders title and description correctly', () => {
    render(<HeroSection {...defaultProps} />);

    expect(screen.getByText(/AGI Strategy/)).toBeInTheDocument();
    expect(screen.getByText(/Artificial General Intelligence/)).toBeInTheDocument();
  });

  it('renders CTA buttons with correct links', () => {
    render(<HeroSection {...defaultProps} />);

    const applyButton = screen.getByRole('link', { name: /Apply now/i });
    const curriculumButton = screen.getByRole('link', { name: /Browse curriculum/i });

    expect(applyButton).toHaveAttribute('href', 'https://example.com/apply');
    expect(curriculumButton).toHaveAttribute('href', '/courses/agi-strategy/1');
  });
});
