import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta = {
  title: 'ui/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    placeholder: 'you@example.com',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  args: { defaultValue: 'ada@example.com' },
};

export const Focus: Story = {
  args: { autoFocus: true },
};

export const Disabled: Story = {
  args: { defaultValue: 'ada@example.com', disabled: true },
};

export const Invalid: Story = {
  args: { defaultValue: 'ada@example', 'aria-invalid': true },
};

export const Password: Story = {
  args: { type: 'password', placeholder: 'Enter your password' },
};
