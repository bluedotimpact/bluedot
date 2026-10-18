import { render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { createMockChunk, createMockResource, createMockUnit } from '../../__tests__/testUtils';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { NEXT_STEPS_CHUNK_ID } from '../../lib/constants';
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
  test('offers AI discussion for AGI Strategy sections only', () => {
    const props = {
      chunks: CHUNKS,
      unit: COURSE_UNITS[0]!,
      unitNumber: '1',
      units: COURSE_UNITS,
      chunkIndex: 0,
      setChunkIndex: vi.fn(),
      courseSlug: 'agi-strategy',
      allUnitChunks: ALL_UNIT_CHUNKS,
    };
    const { getByRole, queryByRole, rerender } = render(<UnitLayout {...props} />, { wrapper: TrpcProvider });

    expect(getByRole('link', { name: /with Claude/ })).toBeTruthy();
    expect(getByRole('link', { name: /with ChatGPT/ })).toBeTruthy();

    rerender(<UnitLayout {...props} courseSlug="test-course" />);

    expect(queryByRole('link', { name: /with Claude/ })).toBeNull();
    expect(queryByRole('link', { name: /with ChatGPT/ })).toBeNull();
  });

  test('updates AI discussion to the section reached with Continue', async () => {
    const user = userEvent.setup();
    const chunks = [
      {
        ...CHUNKS[0]!, id: 'first-chunk', chunkTitle: 'Current capabilities', chunkContent: 'Evidence from current systems.',
      },
      {
        ...CHUNKS[1]!, id: 'second-chunk', chunkTitle: 'Future capabilities', chunkContent: 'Questions about future systems.',
      },
    ];
    const NavigableUnit = () => {
      const [chunkIndex, setChunkIndex] = useState(0);
      return (
        <UnitLayout
          chunks={chunks}
          unit={COURSE_UNITS[1]!}
          unitNumber="2"
          units={COURSE_UNITS}
          chunkIndex={chunkIndex}
          setChunkIndex={setChunkIndex}
          courseSlug="agi-strategy"
          allUnitChunks={ALL_UNIT_CHUNKS}
        />
      );
    };

    const { getByRole } = render(<NavigableUnit />, { wrapper: TrpcProvider });
    const firstPrompt = new URL(getByRole('link', { name: /with Claude/ }).getAttribute('href')!).searchParams.get('q');
    expect(firstPrompt).toContain('Current capabilities');
    expect(firstPrompt).toContain('https://bluedot.org/courses/agi-strategy/2/1');

    await user.click(getByRole('button', { name: 'Continue' }));

    const nextPrompt = new URL(getByRole('link', { name: /with Claude/ }).getAttribute('href')!).searchParams.get('q');
    expect(nextPrompt).toContain('Future capabilities');
    expect(nextPrompt).toContain('Questions about future systems.');
    expect(nextPrompt).toContain('https://bluedot.org/courses/agi-strategy/2/2');
    expect(nextPrompt).not.toContain('Current capabilities');
    expect(nextPrompt).not.toContain('Evidence from current systems.');
  });

  test('does not offer section discussion for the generated next-steps page', () => {
    const { queryByRole } = render(
      <UnitLayout
        chunks={[{ ...CHUNKS[0]!, id: NEXT_STEPS_CHUNK_ID }]}
        unit={COURSE_UNITS[0]!}
        unitNumber="1"
        units={COURSE_UNITS}
        chunkIndex={0}
        setChunkIndex={vi.fn()}
        courseSlug="agi-strategy"
        allUnitChunks={ALL_UNIT_CHUNKS}
      />,
      { wrapper: TrpcProvider },
    );

    expect(queryByRole('link', { name: /with Claude/ })).toBeNull();
    expect(queryByRole('link', { name: /with ChatGPT/ })).toBeNull();
  });

  test('places AI discussion links beside the Resources heading', async () => {
    const { getByRole, findByText } = render(
      <UnitLayout
        chunks={[{ ...CHUNKS[0]!, chunkContent: 'Section introduction.', resources: [createMockResource()] }]}
        unit={COURSE_UNITS[0]!}
        unitNumber="1"
        units={COURSE_UNITS}
        chunkIndex={0}
        setChunkIndex={vi.fn()}
        courseSlug="agi-strategy"
        allUnitChunks={ALL_UNIT_CHUNKS}
      />,
      { wrapper: TrpcProvider },
    );

    await findByText('Section introduction.');
    const resourcesHeader = getByRole('heading', { name: /^Resources/ }).closest('header')!;
    expect(resourcesHeader).toBeTruthy();
    expect(within(resourcesHeader).getByRole('link', { name: /with Claude/ })).toBeTruthy();
    expect(within(resourcesHeader).getByRole('link', { name: /with ChatGPT/ })).toBeTruthy();
  });

  test.each([
    { kind: 'optional readings only', resources: [createMockResource({ coreFurtherMaybe: 'Further' })] },
    { kind: 'no readings', resources: [] },
  ])('keeps AI discussion links after the introduction with $kind', async ({ resources }) => {
    const { getByRole, findByText } = render(
      <UnitLayout
        chunks={[{ ...CHUNKS[0]!, chunkContent: 'Section introduction.', resources }]}
        unit={COURSE_UNITS[0]!}
        unitNumber="1"
        units={COURSE_UNITS}
        chunkIndex={0}
        setChunkIndex={vi.fn()}
        courseSlug="agi-strategy"
        allUnitChunks={ALL_UNIT_CHUNKS}
      />,
      { wrapper: TrpcProvider },
    );

    const introduction = await findByText('Section introduction.');
    const claudeLink = getByRole('link', { name: /with Claude/ });
    const chatgptLink = getByRole('link', { name: /with ChatGPT/ });
    expect(introduction.compareDocumentPosition(claudeLink)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(introduction.compareDocumentPosition(chatgptLink)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
