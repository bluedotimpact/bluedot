import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SearchInput, type SearchInputProps } from './SearchInput';

// Controlled only, so each story holds the value
const Controlled = (props: Omit<SearchInputProps, 'value' | 'onChange'> & { initialValue?: string }) => {
  const { initialValue = '', ...rest } = props;
  const [value, setValue] = useState(initialValue);
  return <SearchInput {...rest} value={value} onChange={setValue} />;
};

const meta = {
  title: 'ui/SearchInput',
  component: Controlled,
  tags: ['autodocs'],
  args: {
    placeholder: 'Search by name or email…',
    'aria-label': 'Search by name or email',
  },
} satisfies Meta<typeof Controlled>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  args: { initialValue: 'alice@bluedot.org' },
};

export const Disabled: Story = {
  args: { initialValue: 'alice@bluedot.org', disabled: true },
};
