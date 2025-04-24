import { render, waitFor } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import { useRouter } from 'next/router';
import type { NextRouter } from 'next/router';
import CourseUnitPage from '../../../../../pages/courses/[courseSlug]/[unitId]';
// Mock next/router
vi.mock('next/router', () => ({
  useRouter: vi.fn(() => ({
    query: { courseSlug: 'test-course', unitId: '3' },
  })),
}));

// Mock axios-hooks
const mockUseAxios = vi.fn();
vi.mock('axios-hooks', () => ({
  default: (...args: unknown[]) => mockUseAxios(...args),
}));

describe('CourseUnitPage', () => {
  test('renders unit 0 correctly with 0-indexed units', async () => {
    vi.mocked(useRouter).mockReturnValueOnce({
      query: { courseSlug: 'test-course', unitId: '0' },
    } as unknown as NextRouter);

    const mockUnits = [
      { unitNumber: '0', title: 'Icebreaker', content: 'Welcome to the course' },
      { unitNumber: '1', title: 'Unit 1', content: 'First unit content' },
      { unitNumber: '2', title: 'Unit 2', content: 'Second unit content' },
      { unitNumber: '3', title: 'Unit 3', content: 'Third unit content' },
    ];

    mockUseAxios.mockReturnValue([{
      data: { units: mockUnits, unit: mockUnits[0] },
      loading: false,
    }]);

    const { getByRole, getByText } = render(<CourseUnitPage />);

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Icebreaker');
    // Markdown renders async
    waitFor(() => expect(getByText('Welcome to the course')).toBeTruthy());
  });

  test('renders unit 3 correctly with 0-indexed units', () => {
    const mockUnits = [
      { unitNumber: '0', title: 'Icebreaker', content: 'Welcome to the course' },
      { unitNumber: '1', title: 'Unit 1', content: 'First unit content' },
      { unitNumber: '2', title: 'Unit 2', content: 'Second unit content' },
      { unitNumber: '3', title: 'Unit 3', content: 'Third unit content' },
    ];

    mockUseAxios.mockReturnValue([{
      data: { units: mockUnits, unit: mockUnits[3] },
      loading: false,
    }]);

    const { getByRole, getByText } = render(<CourseUnitPage />);

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Unit 3');
    // Markdown renders async
    waitFor(() => expect(getByText('Third unit content')).toBeTruthy());
  });

  test('renders unit 3 correctly with 1-indexed units', () => {
    const mockUnits = [
      { unitNumber: '1', title: 'Unit 1', content: 'First unit content' },
      { unitNumber: '2', title: 'Unit 2', content: 'Second unit content' },
      { unitNumber: '3', title: 'Unit 3', content: 'Third unit content' },
      { unitNumber: '4', title: 'Unit 4', content: 'Fourth unit content' },
    ];

    mockUseAxios.mockReturnValue([{
      data: { units: mockUnits, unit: mockUnits[2] },
      loading: false,
    }]);

    const { getByRole, getByText } = render(<CourseUnitPage />);

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Unit 3');
    // Markdown renders async
    waitFor(() => expect(getByText('Third unit content')).toBeTruthy());
  });

  test('renders unit 3 correctly when unit 2 is missing', () => {
    const mockUnits = [
      { unitNumber: '1', title: 'Unit 1', content: 'First unit content' },
      { unitNumber: '3', title: 'Unit 3', content: 'Third unit content' },
      { unitNumber: '4', title: 'Unit 4', content: 'Fourth unit content' },
    ];

    mockUseAxios.mockReturnValue([{
      data: { units: mockUnits, unit: mockUnits[1] },
      loading: false,
    }]);

    const { getByRole, getByText } = render(<CourseUnitPage />);

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Unit 3');
    // Markdown renders async
    waitFor(() => expect(getByText('Third unit content')).toBeTruthy());
  });
});
