import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';

const meta = {
  title: 'ui/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  args: {
    placeholder: 'Write your answer here…',
    rows: 4,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE = 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! Sphinx of black quartz, judge my vow.';

export const Default: Story = {};

export const Filled: Story = {
  args: { defaultValue: SAMPLE },
};

export const Disabled: Story = {
  args: { defaultValue: SAMPLE, disabled: true },
};

export const ReadOnly: Story = {
  args: { defaultValue: SAMPLE, readOnly: true },
};
