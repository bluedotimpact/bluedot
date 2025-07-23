import type { Meta, StoryObj } from '@storybook/react';
import {
  FaRegUser,
  FaRightLeft,
  FaArrowRightFromBracket,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaArrowRightToBracket,
  FaUser,
  FaUsers,
  FaUserGroup,
} from 'react-icons/fa6';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  args: {
    options: [
      {
        value: 'switch-group',
        label: 'Switch Group',
        icon: <FaRightLeft className="text-gray-600" />,
      },
      {
        value: 'drop-out',
        label: 'Drop out / Defer',
        icon: <FaArrowRightFromBracket className="text-gray-600" />,
      },
      { value: 'option3', label: 'Option 3' },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    label: 'Select an option',
    placeholder: 'Example Placeholder',
    icon: <FaRegUser />,
    options: [
      {
        value: 'switch-group',
        label: 'Switch Group',
        icon: <FaRightLeft className="text-gray-600" />,
      },
      {
        value: 'drop-out',
        label: 'Drop out / Defer',
        icon: <FaArrowRightFromBracket className="text-gray-600" />,
      },
      { value: 'cohort23-groupA', label: 'Cohort 23: Group A' },
    ],
  },
};

export const WithIcon: Story = {
  args: {
    label: 'User',
    icon: <FaRegUser />,
    placeholder: 'Select a user',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Select',
    disabled: true,
    value: 'option1',
  },
};

export const WithIconsInOptions: Story = {
  args: {
    label: 'Contact Method',
    placeholder: 'Choose contact method',
    options: [
      { value: 'email', label: 'Email', icon: <FaEnvelope className="text-gray-600" /> },
      { value: 'phone', label: 'Phone', icon: <FaPhone className="text-gray-600" /> },
      { value: 'website', label: 'Website', icon: <FaGlobe className="text-gray-600" /> },
    ],
  },
};

export const WithBothIcons: Story = {
  args: {
    label: 'User Contact',
    icon: <FaUserGroup />,
    placeholder: 'Select contact method',
    options: [
      {
        value: 'switch-group',
        label: 'Switch Group',
        icon: <FaRightLeft className="text-gray-600" />,
      },
      {
        value: 'drop-out',
        label: 'Drop out / Defer',
        icon: <FaArrowRightToBracket className="text-gray-600" />,
      },
    ],
  },
};
