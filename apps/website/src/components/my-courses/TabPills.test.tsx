import { fireEvent, render, screen } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import TabPills from './TabPills';

const TABS = [
  { id: 'inProgress', label: 'In Progress' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'pastCourses', label: 'Past Courses' },
] as const;

describe('TabPills', () => {
  test('renders one pill per entry and marks the active one', () => {
    render(<TabPills ariaLabel="Course filter" tabs={TABS} value="upcoming" onChange={() => {}} />);
    const pills = screen.getAllByRole('button');
    expect(pills).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Upcoming' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'In Progress' }).getAttribute('aria-pressed')).toBe('false');
  });

  test('fires onChange with the clicked pill id', () => {
    const onChange = vi.fn();
    render(<TabPills ariaLabel="Course filter" tabs={TABS} value="inProgress" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Past Courses' }));
    expect(onChange).toHaveBeenCalledWith('pastCourses');
  });
});
