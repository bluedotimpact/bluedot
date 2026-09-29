import type { Meta, StoryObj } from '@storybook/react';
import { Callout, type CalloutTone } from './Callout';

const TONES: CalloutTone[] = ['info', 'success', 'warning', 'error'];

const meta = {
  title: 'ui/Callout',
  component: Callout,
  tags: ['autodocs'],
  args: {
    tone: 'info',
    title: 'Next round opens soon',
    children: 'Apply while you’re still eligible.',
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllTones: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {TONES.map((tone) => <Callout key={tone} {...args} tone={tone} title={`${tone[0]!.toUpperCase()}${tone.slice(1)} title`} />)}
    </div>
  ),
};

export const WithoutTitle: Story = {
  args: { title: undefined, children: 'Your changes apply from the next unit.' },
};

export const OneAction: Story = {
  args: {
    actions: [{ label: 'Apply now', url: '#' }],
  },
};

export const TwoActions: Story = {
  args: {
    tone: 'warning',
    title: 'You’ve been removed from discussions',
    children: 'Rejoin a group to keep your place in the course.',
    actions: [
      { label: 'Rejoin a group', onClick: () => {} },
      { label: 'Drop out of course', emphasis: 'secondary', onClick: () => {} },
    ],
  },
};

export const SecondaryActions: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {TONES.map((tone) => (
        <Callout
          key={tone}
          {...args}
          tone={tone}
          actions={[{ label: 'Primary', onClick: () => {} }, { label: 'Secondary', emphasis: 'secondary', onClick: () => {} }]}
        />
      ))}
    </div>
  ),
};

export const Dismissible: Story = {
  args: { onDismiss: () => {} },
};

export const DismissibleWithAction: Story = {
  args: {
    title: 'Quick Apply (~2 min)',
    children: 'Facilitate the same course again as a returning facilitator.',
    actions: [{ label: 'Quick apply', url: '#' }],
    onDismiss: () => {},
  },
};

export const LongContent: Story = {
  args: {
    tone: 'error',
    title: 'We couldn’t connect to the sync service',
    children: (
      <>
        <p>The service didn’t respond. Check the following before you try again:</p>
        <ul className="list-disc pl-5">
          <li>The service is deployed and healthy.</li>
          <li>Your account has admin access.</li>
        </ul>
      </>
    ),
  },
};

// Actions wrap below the body once it would drop under 220px, then fill the width
export const Narrow: Story = {
  ...TwoActions,
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
};
