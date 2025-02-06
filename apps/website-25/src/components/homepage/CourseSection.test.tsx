import { render, screen } from '@testing-library/react';
import {
  describe, expect, test, beforeEach,
} from 'vitest';
import CourseSection from './CourseSection';

describe('CourseSection', () => {
  // Mock window.innerWidth
  const setWindowWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  };

  beforeEach(() => {
    // Default to desktop view
    setWindowWidth(1024);
  });

  test('renders desktop view as expected', () => {
    const { container } = render(<CourseSection />);
    expect(container).toMatchSnapshot();

    // Verify featured course is present
    expect(screen.getByText('AI Safety: Intro to Transformative AI')).toBeDefined();

    // Verify navigation is in header on desktop
    const header = container.querySelector('.slide-list__header');
    expect(header?.querySelector('[aria-label="Previous slide"]')).toBeDefined();
  });
});
