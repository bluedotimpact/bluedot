import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LandingBanner from './LandingBanner';

const mockProps = {
  title: 'Start building towards a good future today',
  ctaText: 'Apply now',
  ctaUrl: 'https://example.com/apply',
  imageSrc: '/images/lander/agi-strategy/hero-banner-split.webp',
  imageAlt: 'AGI Strategy banner',
  iconSrc: '/images/agi-strategy/bluedot-icon.svg',
  iconAlt: 'BlueDot',
  noiseImageSrc: '/images/agi-strategy/noise.webp',
};

describe('LandingBanner', () => {
  it('renders correctly', () => {
    const { container } = render(<LandingBanner {...mockProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders the title', () => {
    const { getByText } = render(<LandingBanner {...mockProps} />);
    expect(getByText('Start building towards a good future today')).toBeDefined();
  });

  it('renders the CTA button with correct link', () => {
    const { getByRole } = render(<LandingBanner {...mockProps} />);
    const ctaButton = getByRole('link', { name: 'Apply now' });
    expect(ctaButton).toBeDefined();
    expect(ctaButton.getAttribute('href')).toBe('https://example.com/apply');
  });

  it('renders the icon', () => {
    const { getByAltText } = render(<LandingBanner {...mockProps} />);
    expect(getByAltText('BlueDot')).toBeDefined();
  });
});
