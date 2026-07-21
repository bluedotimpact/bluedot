import type { Meta, StoryObj } from '@storybook/react';
import { H1 } from '@bluedot/ui';
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
        <H1 className="text-size-xl">Next steps</H1>
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
