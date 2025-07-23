import type { Meta, StoryObj } from '@storybook/react';
import {
  FaUser, FaEnvelope, FaPhone, FaGlobe,
} from 'react-icons/fa6';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  args: {
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    label: 'Select an option',
    placeholder: 'Choose...',
  },
};

export const WithIcon: Story = {
  args: {
    label: 'User',
    icon: <FaUser />,
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
      { value: 'email', label: 'Email', icon: <FaEnvelope className="text-bluedot-normal" /> },
      { value: 'phone', label: 'Phone', icon: <FaPhone className="text-bluedot-normal" /> },
      { value: 'website', label: 'Website', icon: <FaGlobe className="text-bluedot-normal" /> },
    ],
  },
};

export const WithBothIcons: Story = {
  args: {
    label: 'User Contact',
    icon: <FaUser />,
    placeholder: 'Select contact method',
    options: [
      { value: 'email', label: 'john@example.com', icon: <FaEnvelope className="text-bluedot-normal" /> },
      { value: 'phone', label: '+1 234 567 8900', icon: <FaPhone className="text-bluedot-normal" /> },
      { value: 'website', label: 'www.example.com', icon: <FaGlobe className="text-bluedot-normal" /> },
    ],
  },
};
