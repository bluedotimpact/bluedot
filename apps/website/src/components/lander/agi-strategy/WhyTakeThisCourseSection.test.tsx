import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WhyTakeThisCourseSection from './WhyTakeThisCourseSection';

describe('WhyTakeThisCourseSection', () => {
  it('renders correctly', () => {
    const { container } = render(<WhyTakeThisCourseSection />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders all three value cards', () => {
    const { getByText } = render(<WhyTakeThisCourseSection />);

    // Check all card titles are rendered
    expect(getByText('Join a network of builders')).toBeDefined();
    expect(getByText('Take action in less than 30 hours')).toBeDefined();
    expect(getByText('Get funded to accelerate your impact')).toBeDefined();
  });

  it('renders value card descriptions', () => {
    const { getByText } = render(<WhyTakeThisCourseSection />);

    // Check first card description
    expect(getByText(/This course isn.t for everyone/)).toBeDefined();

    // Check second card description
    expect(getByText(/You don.t need another degree/)).toBeDefined();

    // Check third card description
    expect(getByText(/If your final course proposal is strong/)).toBeDefined();
  });
});
