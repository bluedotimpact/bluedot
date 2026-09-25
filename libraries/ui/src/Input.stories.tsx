import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6';
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

const SearchExample = () => {
  const [value, setValue] = useState('Alan Turing');
  return (
    <Input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search by name..."
      aria-label="Search"
      leading={<FaMagnifyingGlass aria-hidden />}
      trailing={value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setValue('')}
          className="-mr-3 flex size-11 items-center justify-center text-secondary hover:text-primary"
        >
          <FaXmark aria-hidden />
        </button>
      ) : undefined}
    />
  );
};

export const Search: Story = {
  render: () => <SearchExample />,
};

export const Radio: Story = {
  render: () => (
    <form className="flex flex-col gap-4 p-4">
      <Input type="radio" value="This is the first value" name="radio-group" />
      <Input type="radio" value="This is the second value" name="radio-group" />
    </form>
  ),
};
