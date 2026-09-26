import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ComponentProps } from 'react';
import { describe, expect, test } from 'vitest';
import { createMockUnit } from '../../__tests__/testUtils';
import type { BasicChunk, ChunkProgress } from '../../server/routers/courses';
import { CourseSidebarUnit } from './CourseSidebarUnit';

const unit = createMockUnit({ unitNumber: '2', title: 'Technical Alignment' });
const CURRENT = 2;
const OTHER = 1;

const chunks: BasicChunk[] = [
  {
    id: 'chunk-1', chunkTitle: 'Alignment Techniques', chunkOrder: '1', estimatedTime: 90,
  },
  {
    id: 'chunk-2', chunkTitle: 'Case Studies', chunkOrder: '2', estimatedTime: 20,
  },
];

const progress: ChunkProgress[] = [
  { totalCount: 3, completedCount: 1, allCompleted: false },
  { totalCount: 3, completedCount: 3, allCompleted: true },
];

const renderUnit = (overrides: Partial<ComponentProps<typeof CourseSidebarUnit>> = {}) => render(<CourseSidebarUnit
  unit={unit}
  chunks={chunks}
  chunkProgress={progress}
  courseSlug="test-course"
  currentUnitNumber={CURRENT}
  currentChunkIndex={0}
  {...overrides}
/>);

describe('CourseSidebarUnit', () => {
  test('renders every chunk as a link to its route', () => {
    renderUnit();

    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/courses/test-course/2/1',
      '/courses/test-course/2/2',
    ]);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('marks only the active chunk as the current page', () => {
    renderUnit({ currentChunkIndex: 1 });

    expect(screen.getByRole('link', { name: /Alignment Techniques/ })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: /Case Studies/ })).toHaveAttribute('aria-current', 'page');
  });

  test('marks no chunk current when the unit is not the current unit', () => {
    renderUnit({ currentUnitNumber: OTHER });

    expect(screen.queryByRole('link', { current: 'page' })).not.toBeInTheDocument();
  });

  test('opens the current unit and collapses the others', () => {
    const { container, rerender } = renderUnit();
    expect(container.querySelector('details')).toHaveAttribute('open');

    rerender(<CourseSidebarUnit
      unit={unit}
      chunks={chunks}
      chunkProgress={progress}
      courseSlug="test-course"
      currentUnitNumber={OTHER}
      currentChunkIndex={0}
    />);
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  test('strikes through the progress count once every item in a chunk is completed', () => {
    renderUnit();

    expect(screen.getByText('1 of 3 completed')).not.toHaveClass('line-through');
    expect(screen.getByText('3 of 3 completed')).toHaveClass('line-through');
    expect(screen.getByText('1h 30min')).toBeInTheDocument();
    expect(screen.getByText('20min')).toBeInTheDocument();
  });

  test('calls onChunkClick when a chunk link is activated', () => {
    let clicks = 0;
    renderUnit({
      onChunkClick: () => {
        clicks += 1;
      },
    });

    screen.getByRole('link', { name: /Case Studies/ }).click();
    expect(clicks).toBe(1);
  });
});
