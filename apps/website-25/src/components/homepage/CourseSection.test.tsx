import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import CourseSection from './CourseSection';

describe('CourseSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<CourseSection />);
    expect(container).toMatchSnapshot();
  });
});
