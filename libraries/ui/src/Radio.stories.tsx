import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Radio } from './Radio';

const meta = {
  title: 'ui/Radio',
  component: Radio,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Weekly digest',
    name: 'frequency',
  },
} satisfies Meta<typeof Radio>;

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

export const Invalid: Story = {
  args: { 'aria-invalid': true, required: true },
};

export const WrappingLabel: Story = {
  render: (args) => (
    <div className="max-w-xs">
      <Radio {...args}>
        Reinforcement learning from human feedback, including the reward model and the policy optimisation step.
      </Radio>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <fieldset className="flex flex-col">
      <legend className="mb-2 text-size-sm font-semibold text-primary">Email frequency</legend>
      <Radio name="frequency" value="daily">Daily</Radio>
      <Radio name="frequency" value="weekly" defaultChecked>Weekly digest</Radio>
      <Radio name="frequency" value="never">Never</Radio>
    </fieldset>
  ),
};

export const Card: Story = {
  args: { card: true, children: 'Reinforcement learning from human feedback' },
  render: (args) => (
    <div className="w-96">
      <Radio {...args} />
    </div>
  ),
};

export const CardChecked: Story = {
  ...Card,
  args: { ...Card.args, defaultChecked: true },
};

export const CardDisabled: Story = {
  ...Card,
  args: { ...Card.args, disabled: true },
};

export const CardSuccess: Story = {
  ...Card,
  args: { ...Card.args, defaultChecked: true, tone: 'success' },
};

export const CardError: Story = {
  ...Card,
  args: { ...Card.args, defaultChecked: true, tone: 'error' },
};

export const CardSuccessDisabled: Story = {
  ...Card,
  args: {
    ...Card.args, defaultChecked: true, disabled: true, tone: 'success',
  },
};

export const RowSuccess: Story = {
  args: { defaultChecked: true, tone: 'success' },
};

export const RowError: Story = {
  args: { defaultChecked: true, tone: 'error' },
};

const OPTIONS = [
  'Reinforcement learning from human feedback',
  'Supervised fine-tuning on curated examples',
  'Constitutional AI with self-critique',
];

const CardGroupExample = () => {
  const [selected, setSelected] = useState(OPTIONS[0]);

  return (
    <fieldset className="flex w-96 flex-col gap-2">
      <legend className="mb-2 text-size-sm font-semibold text-primary">Which technique does the paper introduce?</legend>
      {OPTIONS.map((option) => (
        <Radio
          key={option}
          card
          name="technique"
          value={option}
          checked={selected === option}
          onChange={() => setSelected(option)}
        >
          {option}
        </Radio>
      ))}
    </fieldset>
  );
};

export const CardGroup: Story = {
  render: () => <CardGroupExample />,
};

// Locked quiz: the chosen answer keeps its success tone even though every option is disabled.
export const QuizResult: Story = {
  render: () => (
    <fieldset className="flex w-96 flex-col gap-2">
      <legend className="mb-2 text-size-sm font-semibold text-primary">Which technique does the paper introduce?</legend>
      {OPTIONS.map((option, i) => (
        <Radio
          key={option}
          card
          name="technique-result"
          value={option}
          defaultChecked={i === 0}
          disabled
          tone={i === 0 ? 'success' : undefined}
        >
          {option}
        </Radio>
      ))}
      <p role="status" className="text-size-sm text-success-fg">Correct</p>
    </fieldset>
  ),
};
