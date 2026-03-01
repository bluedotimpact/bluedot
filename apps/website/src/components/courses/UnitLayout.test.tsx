import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { useRouter } from 'next/router';
import UnitLayout from './UnitLayout';
import { createMockChunk, createMockUnit } from '../../__tests__/testUtils';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import type { BasicChunk } from '../../pages/courses/[courseSlug]/[unitNumber]/[[...chunkNumber]]';

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
    content: '## Welcome to the deep end! \nThis unit explores the core concepts that _every_ fish enthusiast needs to understand, from basic anatomy to the physics of water movement.\nWe\'ll explore how fish \n[ ] communicate,\n[ ] navigate,\n[ ] and survive in their watery world\n...with special attention to the unique adaptations that make each species special.\nThrough hands-on exercises and detailed study materials, you\'ll develop a strong foundation in **_[ichthyology](https://en.wikipedia.org/wiki/Ichthyology)_** (that\'s fish science for those who don\'t speak fluent marine biologist).\n',
    courseTitle: 'What the fish [Test Course]',
    unitNumber: '1',
  }),
  createMockUnit({
    title: 'What Fish Are People Catching, and Why?',
    content: 'Ever wondered why some fishermen chase tuna while others pursue cod? This unit dives into the complex world of modern fishing practices, from traditional line-fishing to industrial-scale operations. We\'ll examine the technological innovations driving the industry, the economic forces at play, and the eternal question of why that one weird fish at the bottom of the ocean looks like that. Through case studies and practical examples, you\'ll understand the delicate balance between feeding humanity and keeping our oceans stocked with sufficiently sassy fish.\n',
    unitNumber: '2',
  }),
  createMockUnit({
    title: 'The Promise of Fish',
    content: 'Fish: they\'re not just for dinner anymore. This unit explores the untapped potential of our scaly friends in solving global challenges. From fish-powered renewable energy to underwater real estate development, we\'ll examine how piscine innovations are reshaping our world. We\'ll also delve into fish-based social networks (Fishbook), fish-inspired fashion trends, and why salmon make excellent financial advisors. Special attention will be paid to the emerging field of fish-human diplomacy.\n',
    unitNumber: '3',
  }),
  createMockUnit({
    title: 'The Risks of Fish',
    content: 'Not all that glitters is goldfish. This unit examines the darker side of piscine potential, from the threat of fish becoming too self-aware to the risks of sharks learning to use smartphones. Through careful analysis and possibly paranoid speculation, we\'ll prepare for worst-case scenarios like fish developing opposable fins or deciding to implement their own cryptocurrency. Includes emergency protocols for dealing with fish uprising scenarios.\n',
    unitNumber: '4',
  }),
  createMockUnit({
    title: 'Contributing to Fish Safety',
    content: '### The future of fish-human relations depends on you! \nThis capstone unit brings together everything we\'ve learned about our aquatic [overlords-in-waiting](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBWqLpd7QgEtYIur4g48rq8PhAApbpOuO2fwoRB1aPvZpijMnS) and channels it into practical action. \nWe\'ll explore how to make the world a safer place for fish while maintaining appropriate species boundaries. \nThrough \n- case studies,\n- hands-on projects,\n- and possibly underwater meditation sessions,\n\nyou\'ll learn to bridge the gap between gill and lung breathers. \n\n> Warning: May cause increased empathy for tuna sandwiches.\n',
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

const ALL_UNIT_CHUNKS: Record<string, BasicChunk[]> = {};
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
        applyCTAProps={undefined}
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
        applyCTAProps={undefined}
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
        applyCTAProps={undefined}
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

  test('renders Congratulations section on final chunk of final unit', async () => {
    // Update router mock to show last chunk
    vi.mocked(useRouter).mockReturnValue({
      query: { chunk: String(CHUNKS.length - 1) },
      pathname: '/courses/test-course/5',
      push: vi.fn(),
      route: '',
      asPath: '',
      basePath: '',
      isFallback: false,
      isLocaleDomain: false,
      isReady: true,
      isPreview: false,
      events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
      prefetch: vi.fn(),
      reload: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      beforePopState: vi.fn(),
    } as ReturnType<typeof useRouter>);

    const { container } = render(
      <UnitLayout
        chunks={CHUNKS}
        unit={COURSE_UNITS[COURSE_UNITS.length - 1]!}
        unitNumber={String(COURSE_UNITS.length)}
        units={COURSE_UNITS}
        chunkIndex={CHUNKS.length - 1}
        setChunkIndex={vi.fn()}
        courseSlug="test-course"
        applyCTAProps={undefined}
        allUnitChunks={ALL_UNIT_CHUNKS}
      />,
      { wrapper: TrpcProvider },
    );

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(container.querySelector('.markdown-extended-renderer')).toBeTruthy();
    });

    expect(container.querySelector('.unit__cta-container')).toBeNull();
    expect(container.querySelector('.congratulations')).toBeTruthy();
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
        applyCTAProps={undefined}
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
        applyCTAProps={undefined}
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
        applyCTAProps={undefined}
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
