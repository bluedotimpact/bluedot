import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { ToggleSwitch } from './ToggleSwitch';

const meta = {
  title: 'ui/ToggleSwitch',
  component: ToggleSwitch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    checked: false,
    'aria-label': 'Show my group\'s responses',
    onChange: () => {},
  },
  render(args) {
    const ControlledDemo = () => {
      const [checked, setChecked] = useState(args.checked);
      return <ToggleSwitch {...args} checked={checked} onChange={setChecked} />;
    };

    return <ControlledDemo />;
  },
} satisfies Meta<typeof ToggleSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledOn: Story = {
  args: {
    checked: true,
    disabled: true,
  },
};
