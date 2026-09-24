import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { ChangeEvent } from 'react';

import { Checkbox } from './Checkbox';

const meta = {
  title: 'ui/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Email me course updates',
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const CheckedDisabled: Story = {
  args: { defaultChecked: true, disabled: true },
};

export const Indeterminate: Story = {
  args: { indeterminate: true },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true, required: true, children: 'I agree to the terms' },
};

export const WrappingLabel: Story = {
  render: (args) => (
    <div className="max-w-xs">
      <Checkbox {...args}>
        I agree to receive occasional emails about new courses, events and opportunities, and I understand I can
        unsubscribe at any time.
      </Checkbox>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <fieldset className="flex flex-col">
      <legend className="mb-2 text-size-sm font-semibold text-primary">Topics of interest</legend>
      <Checkbox name="topics" value="alignment" defaultChecked>AI alignment</Checkbox>
      <Checkbox name="topics" value="governance">AI governance</Checkbox>
      <Checkbox name="topics" value="biosecurity">Biosecurity</Checkbox>
    </fieldset>
  ),
};

export const Card: Story = {
  args: { card: true },
  render: (args) => (
    <div className="w-80">
      <Checkbox {...args} />
    </div>
  ),
};

export const CardChecked: Story = {
  ...Card,
  args: { card: true, defaultChecked: true },
};

export const CardDisabled: Story = {
  ...Card,
  args: { card: true, disabled: true },
};

const CardGroupExample = () => {
  const [selected, setSelected] = useState<string[]>(['flag']);
  const toggle = (value: string) => (e: ChangeEvent<HTMLInputElement>) => {
    setSelected((prev) => (e.target.checked ? [...prev, value] : prev.filter((v) => v !== value)));
  };

  return (
    <fieldset className="flex w-80 flex-col gap-2">
      <legend className="mb-2 text-size-sm font-semibold text-primary">How should we follow up?</legend>
      <Checkbox card checked={selected.includes('flag')} onChange={toggle('flag')}>
        Flag for 1-1 advising
      </Checkbox>
      <Checkbox card checked={selected.includes('none')} onChange={toggle('none')}>
        No further action needed
      </Checkbox>
    </fieldset>
  );
};

export const CardGroup: Story = {
  render: () => <CardGroupExample />,
};
