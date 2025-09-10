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

  it('has correct CSS classes for responsive grid layout', () => {
    const { container } = render(<WhyTakeThisCourseSection />);
    const gridElement = container.querySelector('.grid');

    expect(gridElement?.classList.contains('grid-cols-1')).toBe(true);
    expect(gridElement?.classList.contains('md:grid-cols-2')).toBe(true);
    expect(gridElement?.classList.contains('lg:grid-cols-4')).toBe(true);
  });

  it('renders icons for each value card', () => {
    const { container } = render(<WhyTakeThisCourseSection />);
    const svgElements = container.querySelectorAll('svg');

    // Should have 4 SVG icons, one for each card
    expect(svgElements).toHaveLength(4);
  });

  it('applies correct styling to section', () => {
    const { container } = render(<WhyTakeThisCourseSection />);
    const section = container.querySelector('section');

    expect(section?.classList.contains('w-full')).toBe(true);
    expect(section?.classList.contains('border-t-[0.5px]')).toBe(true);
    expect(section?.classList.contains('border-color-divider')).toBe(true);
    expect(section?.classList.contains('bg-white')).toBe(true);
  });
});
