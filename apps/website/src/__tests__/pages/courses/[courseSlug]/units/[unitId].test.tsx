import { render, waitFor } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import { useRouter } from 'next/router';
import type { NextRouter } from 'next/router';
import CourseUnitPage from '../../../../../pages/courses/[courseSlug]/[unitId]';
import { Unit, Chunk } from '../../../../../lib/api/db/tables';

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

const createMockUnit = (unitNumber: string, title: string, content: string): Unit => ({
  chunks: ['recuC87TILbjW4eF4'],
  courseId: 'rec8CeVOWU0mGu2Jf',
  courseTitle: 'Test Course',
  coursePath: '/courses/test-course',
  courseSlug: 'test-course',
  path: `/courses/test-course/${unitNumber}`,
  title,
  content,
  duration: 30,
  unitNumber,
  menuText: title,
  description: `${title} description`,
  learningOutcomes: `Learning outcomes for ${title}`,
  unitPodcastUrl: '',
  id: `unit-${unitNumber}`,
});

const createMockChunk = (unitId: string): Chunk => ({
  chunkId: 'recuC87TILbjW4eF4',
  unitId,
  chunkTitle: 'Test Chunk',
  chunkOrder: '1',
  chunkType: 'Reading',
  chunkContent: 'Test chunk content',
  id: 'recuC87TILbjW4eF4',
});

describe('CourseUnitPage', () => {
  test('renders unit 0 correctly with 0-indexed units', async () => {
    vi.mocked(useRouter).mockReturnValueOnce({
      query: { courseSlug: 'test-course', unitId: '0' },
    } as unknown as NextRouter);

    const mockUnits = [
      createMockUnit('0', 'Icebreaker', 'Welcome to the course'),
      createMockUnit('1', 'Unit 1', 'First unit content'),
      createMockUnit('2', 'Unit 2', 'Second unit content'),
      createMockUnit('3', 'Unit 3', 'Third unit content'),
    ];

    const mockChunks = [createMockChunk(mockUnits[0]!.id)];

    mockUseAxios.mockReturnValue([{
      data: {
        units: mockUnits,
        unit: mockUnits[0]!,
        chunks: mockChunks,
      },
      loading: false,
    }]);

    const { getByRole, getByText } = render(<CourseUnitPage />);

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Test Chunk');
    await waitFor(() => expect(getByText('Test chunk content')).toBeTruthy());
  });

  test('renders unit 3 correctly with 0-indexed units', async () => {
    const mockUnits = [
      createMockUnit('0', 'Icebreaker', 'Welcome to the course'),
      createMockUnit('1', 'Unit 1', 'First unit content'),
      createMockUnit('2', 'Unit 2', 'Second unit content'),
      createMockUnit('3', 'Unit 3', 'Third unit content'),
    ];

    const mockChunks = [createMockChunk(mockUnits[3]!.id)];

    mockUseAxios.mockReturnValue([{
      data: {
        units: mockUnits,
        unit: mockUnits[3]!,
        chunks: mockChunks,
      },
      loading: false,
    }]);

    const { getByRole, getByText } = render(<CourseUnitPage />);

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Test Chunk');
    await waitFor(() => expect(getByText('Test chunk content')).toBeTruthy());
  });

  test('renders unit 3 correctly with 1-indexed units', async () => {
    const mockUnits = [
      createMockUnit('1', 'Unit 1', 'First unit content'),
      createMockUnit('2', 'Unit 2', 'Second unit content'),
      createMockUnit('3', 'Unit 3', 'Third unit content'),
      createMockUnit('4', 'Unit 4', 'Fourth unit content'),
    ];

    const mockChunks = [createMockChunk(mockUnits[2]!.id)];

    mockUseAxios.mockReturnValue([{
      data: {
        units: mockUnits,
        unit: mockUnits[2]!,
        chunks: mockChunks,
      },
      loading: false,
    }]);

    const { getByRole, getByText } = render(<CourseUnitPage />);

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Test Chunk');
    await waitFor(() => expect(getByText('Test chunk content')).toBeTruthy());
  });

  test('renders unit 3 correctly when unit 2 is missing', async () => {
    const mockUnits = [
      createMockUnit('1', 'Unit 1', 'First unit content'),
      createMockUnit('3', 'Unit 3', 'Third unit content'),
      createMockUnit('4', 'Unit 4', 'Fourth unit content'),
    ];

    const mockChunks = [createMockChunk(mockUnits[1]!.id)];

    mockUseAxios.mockReturnValue([{
      data: {
        units: mockUnits,
        unit: mockUnits[1]!,
        chunks: mockChunks,
      },
      loading: false,
    }]);

    const { getByRole, getByText } = render(<CourseUnitPage />);

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Test Chunk');
    await waitFor(() => expect(getByText('Test chunk content')).toBeTruthy());
  });
});
