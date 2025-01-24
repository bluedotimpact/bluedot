import {
  describe, expect, test,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseCard, CourseCardButton } from './CourseCard';

const mockProps = {
  title: 'Test Course',
  description: 'This is a test course description.',
  courseType: 'Crash course',
  image: 'test-image.jpg',
};

describe('CourseCard', () => {
  test('renders with title and description', () => {
    render(<CourseCard {...mockProps} />);
    const title = screen.getByText('Test Course');
    const description = screen.getByText('This is a test course description.');
    expect(title).toBeTruthy();
    expect(description).toBeTruthy();
  });

  test('displays correct course length based on course type', () => {
    render(<CourseCard {...mockProps} courseType="Self-paced" />);
    const courseLength = screen.getByText('12 weeks');
    expect(courseLength).toBeTruthy();
  });
});

describe('CourseCardButton', () => {
  test('renders with default classes', () => {
    render(<CourseCardButton>Click me</CourseCardButton>);
    const button = screen.getByText('Click me');
    expect(button.className).toContain('border border-neutral-500 rounded');
  });
});
