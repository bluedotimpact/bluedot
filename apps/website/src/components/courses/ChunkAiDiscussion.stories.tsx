import type { Meta, StoryObj } from '@storybook/react';
import { createMockChunk, createMockUnit } from '../../__tests__/testUtils';
import ChunkAiDiscussion from './ChunkAiDiscussion';

const meta = {
  title: 'website/courses/ChunkAiDiscussion',
  component: ChunkAiDiscussion,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    courseSlug: 'agi-strategy',
    chunkIndex: 0,
    unit: createMockUnit({ courseTitle: 'AGI Strategy', title: 'Drivers of AI Progress', unitNumber: '2' }),
    chunk: {
      ...createMockChunk({
        chunkTitle: 'What drives AI progress?',
        chunkContent: 'What resources and methods are improving, what can AI systems do, and what would those capabilities enable?',
      }),
      resources: [],
      exercises: [],
    },
  },
} satisfies Meta<typeof ChunkAiDiscussion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [(Story) => (
    <header className="flex items-center justify-between gap-3">
      <h4 className="text-size-md font-semibold">Resources</h4>
      <Story />
    </header>
  )],
};
