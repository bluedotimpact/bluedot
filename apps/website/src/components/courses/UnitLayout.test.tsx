import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { createMockChunk, createMockUnit } from '../../__tests__/testUtils';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import UnitLayout from './UnitLayout';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: vi.fn(() => ({
    query: { chunk: '0' },
    pathname: '/courses/test-course/1',
    push: vi.fn(),
  })),
}));

const COURSE_UNITS = [
  createMockUnit({
    title: 'Basic Principles of Fish',
    courseTitle: 'What the fish [Test Course]',
    unitNumber: '1',
  }),
  createMockUnit({
    title: 'What Fish Are People Catching, and Why?',
    unitNumber: '2',
  }),
  createMockUnit({
    title: 'The Promise of Fish',
    unitNumber: '3',
  }),
  createMockUnit({
    title: 'The Risks of Fish',
    unitNumber: '4',
  }),
  createMockUnit({
    title: 'Contributing to Fish Safety',
    unitNumber: '5',
  }),
];

const CHUNKS = [
  {
    ...createMockChunk({
      chunkContent: 'Five years ago, AI systems struggled to form coherent sentences. Today, \u003E5% of the world use AI products like ChatGPT every week for help with work, studies, and creative projects. These systems extend far beyond a simple chat. They can produce art, write complex code, and control robots to do real-world tasks. \n\nThis unit explores how AI is evolving from simple "tools" into autonomous "agents",  capable of setting goals, making complex plans, and acting in the real world.\n',
      chunkTitle: 'What can AI do today?',
    }),
    resources: [],
    exercises: [],
  },
  {
    ...createMockChunk({
      chunkContent: 'Five years ago, AI systems struggled to form coherent sentences. Today, \u003E5% of the world use AI products like ChatGPT every week for help with work, studies, and creative projects. These systems extend far beyond a simple chat. They can produce art, write complex code, and control robots to do real-world tasks. \n\nThis unit explores how AI is evolving from simple "tools" into autonomous "agents",  capable of setting goals, making complex plans, and acting in the real world.\n',
      chunkTitle: 'What can AI do today?',
    }),
    resources: [],
    exercises: [],
  },
];

const ALL_UNIT_CHUNKS: Record<string, { id: string; chunkTitle: string; chunkOrder: string; estimatedTime: number | null; chunkResources: string[] | null; chunkExercises: string[] | null }[]> = {};
COURSE_UNITS.forEach((unit) => {
  ALL_UNIT_CHUNKS[unit.id] = CHUNKS.map((chunk) => ({
    id: chunk.id,
    chunkTitle: chunk.chunkTitle,
    chunkOrder: chunk.chunkOrder,
    estimatedTime: chunk.estimatedTime,
    chunkResources: chunk.chunkResources,
    chunkExercises: chunk.chunkExercises,
  }));
});

describe('UnitLayout', () => {
  test('renders first unit as expected', async () => {
    const { container } = render(
      <UnitLayout
        chunks={CHUNKS}
        unit={COURSE_UNITS[0]!}
        unitNumber="1"
        units={COURSE_UNITS}
        chunkIndex={0}
        setChunkIndex={vi.fn()}
        courseSlug="test-course"
        allUnitChunks={ALL_UNIT_CHUNKS}
      />,
      { wrapper: TrpcProvider },
    );

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(container.querySelector('.markdown-extended-renderer')).toBeTruthy();
    });

    expect(container).toMatchSnapshot();
  });

  test('renders previous and next unit buttons for middle unit', async () => {
    const { container } = render(
      <UnitLayout
        chunks={CHUNKS}
        unit={COURSE_UNITS[1]!}
        unitNumber="2"
        units={COURSE_UNITS}
        chunkIndex={0}
        setChunkIndex={vi.fn()}
        courseSlug="test-course"
        allUnitChunks={ALL_UNIT_CHUNKS}
      />,
      { wrapper: TrpcProvider },
    );

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(container.querySelector('.markdown-extended-renderer')).toBeTruthy();
    });

    expect(container.querySelector('.unit__cta-link')).toMatchSnapshot();
  });

  test('does not render Congratulations section if it is not the final chunk of final unit', async () => {
    const { container } = render(
      <UnitLayout
        chunks={CHUNKS}
        unit={COURSE_UNITS[COURSE_UNITS.length - 1]!}
        unitNumber={String(COURSE_UNITS.length)}
        units={COURSE_UNITS}
        chunkIndex={0}
        setChunkIndex={vi.fn()}
        courseSlug="test-course"
        allUnitChunks={ALL_UNIT_CHUNKS}
      />,
      { wrapper: TrpcProvider },
    );

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(container.querySelector('.markdown-extended-renderer')).toBeTruthy();
    });

    expect(container.querySelector('.unit__cta-container')).not.toBeNull();
    expect(container.querySelector('.unit__last-unit-cta-container')).toBeFalsy();
    expect(container.querySelector('.congratulations')).toBeFalsy();
  });

  test('renders no CTA on final chunk of final unit', async () => {
    const { container } = render(
      <UnitLayout
        chunks={CHUNKS}
        unit={COURSE_UNITS[COURSE_UNITS.length - 1]!}
        unitNumber={String(COURSE_UNITS.length)}
        units={COURSE_UNITS}
        chunkIndex={CHUNKS.length - 1}
        setChunkIndex={vi.fn()}
        courseSlug="test-course"
        allUnitChunks={ALL_UNIT_CHUNKS}
      />,
      { wrapper: TrpcProvider },
    );

    await waitFor(() => {
      expect(container.querySelector('.markdown-extended-renderer')).toBeTruthy();
    });
    expect(container.querySelector('.unit__cta-container')).toBeNull();
    expect(container.querySelector('.congratulations')).toBeNull();
  });

  test('keyboard navigation component is displayed', async () => {
    const user = userEvent.setup();
    const { container, getByRole } = render(
      <UnitLayout
        chunks={CHUNKS}
        unit={COURSE_UNITS[0]!}
        unitNumber="1"
        units={COURSE_UNITS}
        chunkIndex={0}
        setChunkIndex={vi.fn()}
        courseSlug="test-course"
        allUnitChunks={ALL_UNIT_CHUNKS}
      />,
      { wrapper: TrpcProvider },
    );

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(container.querySelector('.markdown-extended-renderer')).toBeTruthy();
    });

    const keyboardNavMenu = getByRole('button', { name: 'Keyboard shortcuts' });
    expect(keyboardNavMenu).toBeTruthy();
    await user.click(keyboardNavMenu);
    expect(getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeTruthy();
  });

  test('navigation buttons have keyboard shortcut tooltips', async () => {
    const { container } = render(
      <UnitLayout
        chunks={CHUNKS}
        unit={COURSE_UNITS[1]!}
        unitNumber="2"
        units={COURSE_UNITS}
        chunkIndex={0}
        setChunkIndex={vi.fn()}
        courseSlug="test-course"
        allUnitChunks={ALL_UNIT_CHUNKS}
      />,
      { wrapper: TrpcProvider },
    );

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(container.querySelector('.markdown-extended-renderer')).toBeTruthy();
    });

    const prevButton = container.querySelector('button[aria-label="Previous"]');
    const nextButton = container.querySelector('button[aria-label="Next"]');

    expect(prevButton?.getAttribute('title')).toBe('Navigate to previous section (use ← arrow key)');
    expect(nextButton?.getAttribute('title')).toBe('Navigate to next section (use → arrow key)');
  });

  test('calls setChunkIndex with correct arguments when clicking prev/next', async () => {
    const user = userEvent.setup();
    const mockSetChunkIndex = vi.fn();

    const testChunks = [
      { ...CHUNKS[0]!, id: 'chunk1' },
      { ...CHUNKS[0]!, id: 'chunk2' },
      { ...CHUNKS[0]!, id: 'chunk3' },
    ];

    const { container } = render(
      <UnitLayout
        chunks={testChunks}
        unit={COURSE_UNITS[1]!}
        unitNumber="2"
        units={COURSE_UNITS}
        chunkIndex={1}
        setChunkIndex={mockSetChunkIndex}
        courseSlug="test-course"
        allUnitChunks={ALL_UNIT_CHUNKS}
      />,
      { wrapper: TrpcProvider },
    );

    await waitFor(() => {
      expect(container.querySelector('.markdown-extended-renderer')).toBeTruthy();
    });

    const prevButton = container.querySelector('button[aria-label="Previous"]');
    const nextButton = container.querySelector('button[aria-label="Next"]');

    await user.click(prevButton!);
    expect(mockSetChunkIndex).toHaveBeenCalledWith(0);

    mockSetChunkIndex.mockClear();

    await user.click(nextButton!);
    expect(mockSetChunkIndex).toHaveBeenCalledWith(2);
  });
});
