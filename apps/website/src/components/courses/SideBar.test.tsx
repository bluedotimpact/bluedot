import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { createMockChunk, createMockUnit } from '../../__tests__/testUtils';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import SideBar from './SideBar';
import type { BasicChunk } from '../../server/routers/courses';

const COURSE_UNITS = [
  createMockUnit({
    title: 'Basic Principles of Fish',
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
  createMockChunk({
    chunkTitle: 'What can AI do today?',
    chunkContent: 'Five years ago, AI systems struggled to form coherent sentences. Today, >5% of the world use AI products like ChatGPT every week for help with work, studies, and creative projects. These systems extend far beyond a simple chat. They can produce art, write complex code, and control robots to do real-world tasks. \n\nThis unit explores how AI is evolving from simple "tools" into autonomous "agents",  capable of setting goals, making complex plans, and acting in the real world.\n',
  }),
];

// Create allUnitChunks from COURSE_UNITS - each unit gets the CHUNKS mapped to BasicChunk format
const ALL_UNIT_CHUNKS: Record<string, BasicChunk[]> = {};
COURSE_UNITS.forEach((unit) => {
  ALL_UNIT_CHUNKS[unit.id] = CHUNKS.map((chunk) => ({
    id: chunk.id,
    chunkTitle: chunk.chunkTitle,
    chunkOrder: chunk.chunkOrder,
    estimatedTime: chunk.estimatedTime,
  }));
});

describe('SideBar', () => {
  const defaultProps = {
    unitChunks: ALL_UNIT_CHUNKS,
    certificateData: undefined,
    courseTitle: 'What the fish [Test Course]',
    courseSlug: 'test-course',
    units: COURSE_UNITS,
    currentUnitNumber: 1,
    currentChunkIndex: 0,
    onChunkSelect: vi.fn(),
  };

  test('renders default as expected', () => {
    const { container } = render(
      <SideBar {...defaultProps} />,
      { wrapper: TrpcProvider },
    );
    expect(container).toMatchSnapshot();
  });
});
