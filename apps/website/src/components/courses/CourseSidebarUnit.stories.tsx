import type { Meta, StoryObj } from '@storybook/react';
import type { BasicChunk, ChunkProgress } from '../../server/routers/courses';
import { CourseSidebarUnit } from './CourseSidebarUnit';
import { mockUnits } from './courseSidebarStoryFixtures';

const [unit] = mockUnits;
if (!unit) throw new Error('mockUnits is empty');

const meta = {
  title: 'website/courses/CourseSidebarUnit',
  component: CourseSidebarUnit,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <nav className="w-[340px]">
        <Story />
      </nav>
    ),
  ],
  args: {
    unit,
    courseSlug: 'ai-safety',
    currentUnitNumber: 1,
    currentChunkIndex: 0,
  },
} satisfies Meta<typeof CourseSidebarUnit>;

export default meta;
type Story = StoryObj<typeof meta>;

const chunk = (id: string, chunkTitle: string, estimatedTime: number | null): BasicChunk => ({
  id, chunkTitle, chunkOrder: id, estimatedTime,
});

// Every combination of the two meta-line inputs. `estimatedTime` defaults to 0 in the db, so
// "no time" is the common case for chunks nobody has estimated yet.
const metaChunks: BasicChunk[] = [
  chunk('1', 'Time + progress (in progress)', 45),
  chunk('2', 'Time + progress (all completed)', 75),
  chunk('3', 'Time only, no exercises', 20),
  chunk('4', 'No time (0), progress', 0),
  chunk('5', 'No time (null), progress all completed', null),
  chunk('6', 'No time, no exercises: no meta line', 0),
];

const metaProgress: ChunkProgress[] = [
  { totalCount: 4, completedCount: 1, allCompleted: false },
  { totalCount: 3, completedCount: 3, allCompleted: true },
  { totalCount: 0, completedCount: 0, allCompleted: false },
  { totalCount: 2, completedCount: 0, allCompleted: false },
  { totalCount: 5, completedCount: 5, allCompleted: true },
  { totalCount: 0, completedCount: 0, allCompleted: false },
];

export const MetaLineVariants: Story = {
  args: { chunks: metaChunks, chunkProgress: metaProgress },
};

// Logged-out readers get no progress data at all.
export const NoProgressData: Story = {
  args: { chunks: metaChunks, chunkProgress: [] },
};

export const Collapsed: Story = {
  args: { chunks: metaChunks.slice(0, 2), chunkProgress: metaProgress, currentUnitNumber: 2 },
};
