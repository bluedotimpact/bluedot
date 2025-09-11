import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WhyTakeThisCourseSection from './WhyTakeThisCourseSection';

describe('WhyTakeThisCourseSection', () => {
  it('renders correctly', () => {
    const { container } = render(<WhyTakeThisCourseSection />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders the section title', () => {
    const { getByText } = render(<WhyTakeThisCourseSection />);
    expect(getByText('Why take this course')).toBeDefined();
  });

  it('renders all four value cards', () => {
    const { getByText } = render(<WhyTakeThisCourseSection />);

    // Check all card titles are rendered
    expect(getByText('Simulations, Not Slides')).toBeDefined();
    expect(getByText('Your Strategic Action Plan')).toBeDefined();
    expect(getByText('Access to Active Players')).toBeDefined();
    expect(getByText('Frameworks That Matter')).toBeDefined();
  });

  it('renders value card descriptions', () => {
    const { getByText } = render(<WhyTakeThisCourseSection />);

    // Check first card description
    expect(getByText(/No lectures. No PowerPoints/)).toBeDefined();

    // Check second card description
    expect(getByText(/develop your personal roadmap/)).toBeDefined();

    // Check third card description
    expect(getByText(/Connect with people already working/)).toBeDefined();

    // Check fourth card description
    expect(getByText(/Learn the actual models and frameworks/)).toBeDefined();
  });
});
