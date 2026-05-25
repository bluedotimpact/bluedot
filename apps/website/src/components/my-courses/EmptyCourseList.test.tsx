import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmptyCourseList from './EmptyCourseList';

describe('EmptyCourseList', () => {
  test('renders the title and description', () => {
    render(<EmptyCourseList title="No active courses" description="You're not enrolled in any active courses." />);
    expect(screen.getByText('No active courses')).toBeInTheDocument();
    expect(screen.getByText('You\'re not enrolled in any active courses.')).toBeInTheDocument();
  });

  test('renders the CTA link when one is provided', () => {
    render(<EmptyCourseList title="No active courses" cta={{ label: 'Browse courses', href: '/courses' }} />);
    expect(screen.getByRole('link', { name: 'Browse courses' })).toHaveAttribute('href', '/courses');
  });

  test('renders no button when no CTA is provided (e.g. facilitator states)', () => {
    render(<EmptyCourseList title="No past courses" description="Courses you've facilitated will appear here." />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
