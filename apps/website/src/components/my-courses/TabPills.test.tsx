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
  test('renders one tab per entry and marks the active one', () => {
    render(<TabPills ariaLabel="Course filter" tabs={TABS} value="upcoming" onChange={() => {}} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'Upcoming' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'In Progress' }).getAttribute('aria-selected')).toBe('false');
  });

  test('fires onChange with the clicked tab id', () => {
    const onChange = vi.fn();
    render(<TabPills ariaLabel="Course filter" tabs={TABS} value="inProgress" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Past Courses' }));
    expect(onChange).toHaveBeenCalledWith('pastCourses');
  });
});
