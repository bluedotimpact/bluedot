import { render, waitFor } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import { useRouter } from 'next/router';
import type { NextRouter } from 'next/router';
import { Unit } from '@bluedot/db';
import CourseUnitPage from '../../../../../pages/courses/[courseSlug]/[unitNumber]/[[...chunkNumber]]';
import type { ChunkWithContent } from '../../../../../pages/api/courses/[courseSlug]/[unitNumber]/index';
import { renderWithHead } from '../../../../testUtils';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: vi.fn(() => ({
    query: { courseSlug: 'test-course', unitNumber: '3' },
  })),
}));

// Mock <Head>, which doesn't work in tests. See docstring of
// `renderWithHead` for more details.
vi.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => {
    if (typeof window !== 'undefined' && children) {
      return (
        <head-proxy data-testid="head-proxy">
          {children}
        </head-proxy>
      );
    }
    return null;
  },
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
  courseUnit: null,
  path: `/courses/test-course/${unitNumber}`,
  title,
  content,
  duration: 30,
  unitNumber,
  menuText: title,
  description: `${title} description`,
  learningOutcomes: `Learning outcomes for ${title}`,
  unitPodcastUrl: '',
  id: `recUnit${unitNumber}`,
  unitStatus: 'Active',
  autoNumberId: 1,
});

const createMockChunk = (unitId: string): ChunkWithContent => ({
  chunkId: 'recuC87TILbjW4eF4',
  unitId,
  chunkTitle: 'Test Chunk',
  chunkOrder: '1',
  chunkType: 'Reading',
  chunkContent: 'Test chunk content',
  id: 'recuC87TILbjW4eF4',
  metaDescription: 'Test chunk meta description',
  estimatedTime: 10,
  chunkResources: [],
  chunkExercises: [],
  status: 'Active',
  resources: [],
  exercises: [],
});

describe('CourseUnitPage', () => {
  test('renders unit 0 correctly with 0-indexed units', async () => {
    vi.mocked(useRouter).mockReturnValueOnce({
      query: { courseSlug: 'test-course', unitNumber: '0', chunkNumber: ['1'] },
    } as unknown as NextRouter);

    const mockUnits = [
      createMockUnit('0', 'Icebreaker', 'Welcome to the course'),
      createMockUnit('1', 'Unit 1', 'First unit content'),
      createMockUnit('2', 'Unit 2', 'Second unit content'),
      createMockUnit('3', 'Unit 3', 'Third unit content'),
    ];

    const mockChunks = [createMockChunk(mockUnits[0]!.id)];

    // Mock the group discussion API call (returns null for no discussion)
    mockUseAxios.mockReturnValue([{
      data: null,
      loading: false,
    }]);

    const { getByRole, getByText } = render(
      <CourseUnitPage
        units={mockUnits}
        unit={mockUnits[0]!}
        chunks={mockChunks}
        courseSlug="test-course"
        unitNumber="0"
      />,
    );

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Test Chunk');
    await waitFor(() => expect(getByText('Test chunk content')).toBeTruthy());
  });

  test('renders unit 3 correctly with 0-indexed units', async () => {
    vi.mocked(useRouter).mockReturnValueOnce({
      query: { courseSlug: 'test-course', unitNumber: '3', chunkNumber: ['1'] },
    } as unknown as NextRouter);

    const mockUnits = [
      createMockUnit('0', 'Icebreaker', 'Welcome to the course'),
      createMockUnit('1', 'Unit 1', 'First unit content'),
      createMockUnit('2', 'Unit 2', 'Second unit content'),
      createMockUnit('3', 'Unit 3', 'Third unit content'),
    ];

    const mockChunks = [createMockChunk(mockUnits[3]!.id)];

    // Mock the group discussion API call (returns null for no discussion)
    mockUseAxios.mockReturnValue([{
      data: null,
      loading: false,
    }]);

    const { getByRole, getByText } = render(
      <CourseUnitPage
        units={mockUnits}
        unit={mockUnits[3]!}
        chunks={mockChunks}
        courseSlug="test-course"
        unitNumber="3"
      />,
    );

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Test Chunk');
    await waitFor(() => expect(getByText('Test chunk content')).toBeTruthy());
  });

  test('renders unit 3 correctly with 1-indexed units', async () => {
    vi.mocked(useRouter).mockReturnValueOnce({
      query: { courseSlug: 'test-course', unitNumber: '3', chunkNumber: ['1'] },
    } as unknown as NextRouter);

    const mockUnits = [
      createMockUnit('1', 'Unit 1', 'First unit content'),
      createMockUnit('2', 'Unit 2', 'Second unit content'),
      createMockUnit('3', 'Unit 3', 'Third unit content'),
      createMockUnit('4', 'Unit 4', 'Fourth unit content'),
    ];

    const mockChunks = [createMockChunk(mockUnits[2]!.id)];

    // Mock the group discussion API call (returns null for no discussion)
    mockUseAxios.mockReturnValue([{
      data: null,
      loading: false,
    }]);

    const { getByRole, getByText } = render(
      <CourseUnitPage
        units={mockUnits}
        unit={mockUnits[2]!}
        chunks={mockChunks}
        courseSlug="test-course"
        unitNumber="3"
      />,
    );

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Test Chunk');
    await waitFor(() => expect(getByText('Test chunk content')).toBeTruthy());
  });

  test('renders unit 3 correctly when unit 2 is missing', async () => {
    vi.mocked(useRouter).mockReturnValueOnce({
      query: { courseSlug: 'test-course', unitNumber: '3', chunkNumber: ['1'] },
    } as unknown as NextRouter);

    const mockUnits = [
      createMockUnit('1', 'Unit 1', 'First unit content'),
      createMockUnit('3', 'Unit 3', 'Third unit content'),
      createMockUnit('4', 'Unit 4', 'Fourth unit content'),
    ];

    const mockChunks = [createMockChunk(mockUnits[1]!.id)];

    // Mock the group discussion API call (returns null for no discussion)
    mockUseAxios.mockReturnValue([{
      data: null,
      loading: false,
    }]);

    const { getByRole, getByText } = render(
      <CourseUnitPage
        units={mockUnits}
        unit={mockUnits[1]!}
        chunks={mockChunks}
        courseSlug="test-course"
        unitNumber="3"
      />,
    );

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Test Chunk');
    await waitFor(() => expect(getByText('Test chunk content')).toBeTruthy());
  });

  test('renders SEO meta tags during SSR without API calls', () => {
    document.head.innerHTML = '';

    vi.mocked(useRouter).mockReturnValueOnce({
      query: { courseSlug: 'test-course', unitNumber: '3', chunkNumber: ['1'] },
    } as unknown as NextRouter);

    const mockUnits = [
      createMockUnit('1', 'Unit 1', 'First unit content'),
      createMockUnit('2', 'Unit 2', 'Second unit content'),
      createMockUnit('3', 'Unit 3', 'Third unit content'),
    ];

    const mockChunks = [createMockChunk(mockUnits[2]!.id)];

    mockUseAxios.mockReturnValue([{
      data: null,
      loading: false,
    }]);

    renderWithHead(
      <CourseUnitPage
        units={mockUnits}
        unit={mockUnits[2]!}
        chunks={mockChunks}
        courseSlug="test-course"
        unitNumber="3"
      />,
    );

    expect(document.title).toBe('Test Course: Unit 3 | Test Chunk');

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('Test chunk meta description');
  });
});
