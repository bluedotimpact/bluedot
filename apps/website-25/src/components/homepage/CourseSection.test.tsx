import { render, screen } from '@testing-library/react';
import {
  describe, expect, test
} from 'vitest';
import CourseSection from './CourseSection';

describe('CourseSection', () => {
  test('renders as expected', () => {
    const { container } = render(<CourseSection />);
    expect(container).toMatchSnapshot();

    // Verify featured course is present
    expect(screen.getByText('AI Safety: Intro to Transformative AI')).toBeDefined();

    // Verify navigation is present in header
    // TODO Make this check the desktop vs mobile behaviour
    const header = container.querySelector('.slide-list__nav--header');
    expect(header?.querySelector('[aria-label="Previous slide"]')).toBeDefined();
  });
});
