import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WhoIsThisForSection from './WhoIsThisForSection';

describe('WhoIsThisForSection', () => {
  it('renders correctly', () => {
    const { container } = render(<WhoIsThisForSection />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders the section title', () => {
    const { getByText } = render(<WhoIsThisForSection />);
    expect(getByText('Who this course is for')).toBeDefined();
  });

  it('renders all three target audience cards', () => {
    const { getByText } = render(<WhoIsThisForSection />);

    // Check all card titles are rendered
    expect(getByText('For entrepreneurs and operators')).toBeDefined();
    expect(getByText('For leaders')).toBeDefined();
    expect(getByText('For researchers')).toBeDefined();
  });

  it('renders target audience descriptions', () => {
    const { getByText } = render(<WhoIsThisForSection />);

    // Check card descriptions - text is now in spans
    expect(getByText('who want to build solutions that protect humanity.')).toBeDefined();
    expect(getByText('who want to steer AI\'s trajectory towards beneficial outcomes for humanity.')).toBeDefined();
    expect(getByText('who want to take big bets on the most impactful research ideas.')).toBeDefined();
  });
});
