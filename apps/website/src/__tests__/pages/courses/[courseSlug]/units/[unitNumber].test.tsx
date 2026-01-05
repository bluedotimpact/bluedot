import { render, waitFor } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import { useRouter } from 'next/router';
import type { NextRouter } from 'next/router';
import CourseUnitPage from '../../../../../pages/courses/[courseSlug]/[unitNumber]/[[...chunkNumber]]';
import { createMockChunk, createMockUnit, renderWithHead } from '../../../../testUtils';
import { TrpcProvider } from '../../../../trpcProvider';

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
    if (children) {
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

describe('CourseUnitPage', () => {
  test('renders unit 0 correctly with 0-indexed units', async () => {
    vi.mocked(useRouter).mockReturnValueOnce({
      query: { courseSlug: 'test-course', unitNumber: '0', chunkNumber: ['1'] },
    } as unknown as NextRouter);

    const mockUnits = [
      createMockUnit({ unitNumber: '0', title: 'Icebreaker', content: 'Welcome to the course' }),
      createMockUnit({ unitNumber: '1', title: 'Unit 1', content: 'First unit content' }),
      createMockUnit({ unitNumber: '2', title: 'Unit 2', content: 'Second unit content' }),
      createMockUnit({ unitNumber: '3', title: 'Unit 3', content: 'Third unit content' }),
    ];

    const mockChunksWithContent = [{
      ...createMockChunk({ unitId: mockUnits[0]!.id }),
      exercises: [],
      resources: [],
    }];

    // Mock the group discussion API call (returns null for no discussion)
    mockUseAxios.mockReturnValue([{
      data: null,
      loading: false,
    }]);

    const { getByRole, getByText } = render(
      <CourseUnitPage
        units={mockUnits}
        unit={mockUnits[0]!}
        chunks={mockChunksWithContent}
        courseSlug="test-course"
        unitNumber="0"
        courseOgImage="https://bluedot.org/images/logo/link-preview-fallback.png"
      />,
      { wrapper: TrpcProvider },
    );

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Test Chunk');
    await waitFor(() => expect(getByText('Test chunk content')).toBeTruthy());
  });

  test('renders unit 3 correctly with 0-indexed units', async () => {
    vi.mocked(useRouter).mockReturnValueOnce({
      query: { courseSlug: 'test-course', unitNumber: '3', chunkNumber: ['1'] },
    } as unknown as NextRouter);

    const mockUnits = [
      createMockUnit({ unitNumber: '0', title: 'Icebreaker', content: 'Welcome to the course' }),
      createMockUnit({ unitNumber: '1', title: 'Unit 1', content: 'First unit content' }),
      createMockUnit({ unitNumber: '2', title: 'Unit 2', content: 'Second unit content' }),
      createMockUnit({ unitNumber: '3', title: 'Unit 3', content: 'Third unit content' }),
    ];

    const mockChunksWithContent = [{
      ...createMockChunk({ unitId: mockUnits[3]!.id }),
      exercises: [],
      resources: [],
    }];

    // Mock the group discussion API call (returns null for no discussion)
    mockUseAxios.mockReturnValue([{
      data: null,
      loading: false,
    }]);

    const { getByRole, getByText } = render(
      <CourseUnitPage
        units={mockUnits}
        unit={mockUnits[3]!}
        chunks={mockChunksWithContent}
        courseSlug="test-course"
        unitNumber="3"
        courseOgImage="https://bluedot.org/images/logo/link-preview-fallback.png"
      />,
      { wrapper: TrpcProvider },
    );

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Test Chunk');
    await waitFor(() => expect(getByText('Test chunk content')).toBeTruthy());
  });

  test('renders unit 3 correctly with 1-indexed units', async () => {
    vi.mocked(useRouter).mockReturnValueOnce({
      query: { courseSlug: 'test-course', unitNumber: '3', chunkNumber: ['1'] },
    } as unknown as NextRouter);

    const mockUnits = [
      createMockUnit({ unitNumber: '1', title: 'Unit 1', content: 'First unit content' }),
      createMockUnit({ unitNumber: '2', title: 'Unit 2', content: 'Second unit content' }),
      createMockUnit({ unitNumber: '3', title: 'Unit 3', content: 'Third unit content' }),
      createMockUnit({ unitNumber: '4', title: 'Unit 4', content: 'Fourth unit content' }),
    ];

    const mockChunksWithContent = [{
      ...createMockChunk({ unitId: mockUnits[2]!.id }),
      exercises: [],
      resources: [],
    }];

    // Mock the group discussion API call (returns null for no discussion)
    mockUseAxios.mockReturnValue([{
      data: null,
      loading: false,
    }]);

    const { getByRole, getByText } = render(
      <CourseUnitPage
        units={mockUnits}
        unit={mockUnits[2]!}
        chunks={mockChunksWithContent}
        courseSlug="test-course"
        unitNumber="3"
        courseOgImage="https://bluedot.org/images/logo/link-preview-fallback.png"
      />,
      { wrapper: TrpcProvider },
    );

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Test Chunk');
    await waitFor(() => expect(getByText('Test chunk content')).toBeTruthy());
  });

  test('renders unit 3 correctly when unit 2 is missing', async () => {
    vi.mocked(useRouter).mockReturnValueOnce({
      query: { courseSlug: 'test-course', unitNumber: '3', chunkNumber: ['1'] },
    } as unknown as NextRouter);

    const mockUnits = [
      createMockUnit({ unitNumber: '1', title: 'Unit 1', content: 'First unit content' }),
      createMockUnit({ unitNumber: '3', title: 'Unit 3', content: 'Third unit content' }),
      createMockUnit({ unitNumber: '4', title: 'Unit 4', content: 'Fourth unit content' }),
    ];

    const mockChunksWithContent = [{
      ...createMockChunk({ unitId: mockUnits[1]!.id }),
      exercises: [],
      resources: [],
    }];

    // Mock the group discussion API call (returns null for no discussion)
    mockUseAxios.mockReturnValue([{
      data: null,
      loading: false,
    }]);

    const { getByRole, getByText } = render(
      <CourseUnitPage
        units={mockUnits}
        unit={mockUnits[1]!}
        chunks={mockChunksWithContent}
        courseSlug="test-course"
        unitNumber="3"
        courseOgImage="https://bluedot.org/images/logo/link-preview-fallback.png"
      />,
      { wrapper: TrpcProvider },
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
      createMockUnit({ unitNumber: '1', title: 'Unit 1', content: 'First unit content' }),
      createMockUnit({ unitNumber: '2', title: 'Unit 2', content: 'Second unit content' }),
      createMockUnit({ unitNumber: '3', title: 'Unit 3', content: 'Third unit content' }),
    ];

    const mockChunksWithContent = [{
      ...createMockChunk({ unitId: mockUnits[2]!.id, metaDescription: 'Test chunk meta description' }),
      exercises: [],
      resources: [],
    }];

    mockUseAxios.mockReturnValue([{
      data: null,
      loading: false,
    }]);

    renderWithHead(
      <TrpcProvider>
        <CourseUnitPage
          units={mockUnits}
          unit={mockUnits[2]!}
          chunks={mockChunksWithContent}
          courseSlug="test-course"
          unitNumber="3"
          courseOgImage="https://bluedot.org/images/logo/link-preview-fallback.png"
        />
      </TrpcProvider>,
    );

    expect(document.title).toBe('Test Course: Unit 3 | Test Chunk');

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('Test chunk meta description');
  });
});
