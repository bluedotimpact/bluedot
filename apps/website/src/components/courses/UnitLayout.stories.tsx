import type { Meta, StoryObj } from '@storybook/react';
import { loggedInStory, loggedOutStory } from '@bluedot/ui/src/utils/storybook';
import { createMockChunk, createMockUnit } from '../../__tests__/testUtils';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import type { BasicChunk } from '../../server/routers/courses';
import UnitLayout, { type ChunkWithContent } from './UnitLayout';

const mockUnits = [
  createMockUnit({
    id: 'unit-1',
    title: 'Introduction to AI Safety',
    courseTitle: 'AI Safety Fundamentals',
    unitNumber: '1',
  }),
  createMockUnit({
    id: 'unit-2',
    title: 'Technical Alignment',
    courseTitle: 'AI Safety Fundamentals',
    unitNumber: '2',
  }),
  createMockUnit({
    id: 'unit-3',
    title: 'Governance and Policy',
    courseTitle: 'AI Safety Fundamentals',
    unitNumber: '3',
  }),
];

const mockChunks: ChunkWithContent[] = [
  {
    ...createMockChunk({
      id: 'chunk-1',
      chunkTitle: 'What is AI safety?',
      chunkOrder: '1',
      chunkContent: 'AI safety is the field concerned with ensuring that advanced AI systems behave in ways that are beneficial for humanity. This chunk introduces the core concerns.',
    }),
    resources: [],
    exercises: [],
  },
  {
    ...createMockChunk({
      id: 'chunk-2',
      chunkTitle: 'Why does it matter?',
      chunkOrder: '2',
      chunkContent: 'As AI systems become more capable, the stakes of getting alignment right grow. We explore current concerns and historical analogues.',
    }),
    resources: [],
    exercises: [],
  },
];

const allUnitChunks: Record<string, BasicChunk[]> = {};
mockUnits.forEach((unit) => {
  allUnitChunks[unit.id] = mockChunks.map((chunk) => ({
    id: chunk.id,
    chunkTitle: chunk.chunkTitle,
    chunkOrder: chunk.chunkOrder,
    estimatedTime: chunk.estimatedTime,
  }));
});

const handlers = [
  trpcStorybookMsw.groupDiscussions.getByCourseSlug.query(() => null),
  trpcStorybookMsw.courses.getCourseProgress.query(() => ({
    courseProgress: { totalCount: 0, completedCount: 0, percentage: 0 },
    chunkProgressByUnitNumber: {},
  })),
  trpcStorybookMsw.certificates.getStatus.query(() => ({ status: 'not-eligible' as const, hasUpcomingRounds: false })),
];

const meta: Meta<typeof UnitLayout> = {
  title: 'website/courses/UnitLayout',
  component: UnitLayout,
  parameters: {
    layout: 'fullscreen',
    msw: { handlers },
  },
  args: {
    chunks: mockChunks,
    unit: mockUnits[0]!,
    unitNumber: '1',
    units: mockUnits,
    chunkIndex: 0,
    setChunkIndex: () => {},
    courseSlug: 'ai-safety-fundamentals',
    allUnitChunks,
  },
  ...loggedOutStory(),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LoggedIn: Story = {
  ...loggedInStory(),
};

export const LastChunkOfUnit: Story = {
  args: {
    chunkIndex: 1,
  },
};
