import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Field, FieldSet } from './Field';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Checkbox } from './Checkbox';
import { Radio } from './Radio';
import { Select } from './Select';

const meta = {
  title: 'ui/Field',
  component: Field,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Email',
    children: <Input type="email" autoComplete="email" placeholder="you@example.com" />,
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true },
};

export const WithDescription: Story = {
  args: { description: 'We only use this for cohort logistics.' },
};

export const Error: Story = {
  args: {
    required: true,
    description: 'We only use this for cohort logistics.',
    error: 'Enter a valid email address.',
    children: <Input type="email" defaultValue="not-an-email" />,
  },
};

export const LongLabel: Story = {
  args: {
    label: 'In 2-3 sentences: what would you tell BlueDot if we asked "how much time should we invest in this person?"',
    description: 'Feel free to paste this from your 1:1 report.',
    children: <Textarea rows={3} />,
  },
};

const TIMEZONES = [
  { value: '+00:00', label: 'UTC+00:00' },
  { value: '+01:00', label: 'UTC+01:00' },
  { value: '-05:00', label: 'UTC-05:00' },
];

const ControlledSelect = () => {
  const [value, setValue] = useState<string | undefined>(undefined);
  return <Select options={TIMEZONES} value={value} onChange={setValue} />;
};

export const WithSelect: Story = {
  args: {
    label: 'Timezone',
    description: 'Discussion times are shown in this zone.',
    children: <ControlledSelect />,
  },
};

/** Omit `label`: the Checkbox carries its own. Field only adds the error and its wiring. */
export const Acknowledgement: Story = {
  args: {
    label: undefined,
    error: 'You must agree to continue.',
    children: <Checkbox>I agree to share my details with partner organisations</Checkbox>,
  },
};

export const CheckboxGroup: Story = {
  render: () => (
    <FieldSet legend="How should we follow up with them?" description="Check all that apply." required>
      <Checkbox card name="followUp" value="none">No further action needed</Checkbox>
      <Checkbox card name="followUp" value="pipeline">Add to talent pipeline</Checkbox>
      <Checkbox card name="followUp" value="advising">Flag for 1-1 advising</Checkbox>
    </FieldSet>
  ),
};

export const RadioGroupError: Story = {
  render: () => (
    <FieldSet legend="Course" error="Select a course." required>
      <Radio name="course" value="aisf">AI Safety Fundamentals</Radio>
      <Radio name="course" value="gov">AI Governance</Radio>
      <Radio name="course" value="tech">Technical AI Safety</Radio>
    </FieldSet>
  ),
};

/** Stack Fields with `gap-6` (space/lg). */
export const FormLayout: Story = {
  render: () => (
    <form noValidate className="flex flex-col gap-6">
      <Field label="Full name" required>
        <Input autoComplete="name" />
      </Field>
      <Field label="Email" description="We only use this for cohort logistics." required>
        <Input type="email" autoComplete="email" />
      </Field>
      <FieldSet legend="Topics of interest" description="Pick all that apply.">
        <Checkbox name="topics" value="alignment">AI alignment</Checkbox>
        <Checkbox name="topics" value="governance">AI governance</Checkbox>
      </FieldSet>
      <Field label="Anything else?">
        <Textarea rows={3} />
      </Field>
    </form>
  ),
};
