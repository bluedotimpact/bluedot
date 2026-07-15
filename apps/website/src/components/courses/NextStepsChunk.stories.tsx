import type { Meta, StoryObj } from '@storybook/react';
import NextStepsChunk from './NextStepsChunk';

const meta = {
  title: 'website/courses/NextStepsChunk',
  component: NextStepsChunk,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-[900px] text-bluedot-navy">
        <h1 className="text-size-xl font-bold leading-[130%] tracking-[-0.015em]">Next steps</h1>
        <Story />
      </div>
    ),
  ],
  args: {
    courseSlug: 'digital-minds',
  },
} satisfies Meta<typeof NextStepsChunk>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DigitalMinds: Story = {};
