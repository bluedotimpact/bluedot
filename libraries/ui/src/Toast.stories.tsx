import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { Toaster } from './Toast';
import { toast, useToastStore } from './toastStore';

type DemoArgs = {
  message: string;
  description?: string;
  variant?: 'default' | 'success';
  closeButton?: boolean;
  stacked?: boolean;
};

const Demo = ({ message, description, variant = 'default', closeButton = false, stacked = false }: DemoArgs) => {
  useEffect(() => {
    useToastStore.setState({ toasts: [], queue: [], paused: false });
    const fire = () => {
      if (stacked) {
        toast('First', { description: 'Oldest visible toast' });
        toast('Second', { description: 'Middle of the stack' });
        toast.success('Third', { description: 'Newest toast' });
        return;
      }

      const opts = { description, closeButton };
      if (variant === 'success') toast.success(message, opts);
      else toast(message, opts);
    };

    fire();
  }, [message, description, variant, closeButton, stacked]);

  return (
    <div className="p-8">
      <button
        type="button"
        className="cursor-pointer rounded border px-2 py-1 hover:opacity-80"
        onClick={() => {
          if (variant === 'success') toast.success(message, { description, closeButton });
          else toast(message, { description, closeButton });
        }}
      >
        Fire toast
      </button>
      <Toaster />
    </div>
  );
};

const meta = {
  title: 'ui/Toast',
  component: Demo,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { message: 'Saved' },
};

export const WithDescription: Story = {
  args: {
    message: 'Your application has been submitted',
    description: 'We’ll be in touch shortly.',
  },
};

export const Success: Story = {
  args: {
    message: 'Your application has been submitted',
    description: 'We’ll be in touch shortly.',
    variant: 'success',
  },
};

export const WithCloseButton: Story = {
  args: {
    message: 'Saved',
    description: 'Changes have been saved.',
    closeButton: true,
  },
};

export const Stacked: Story = {
  args: { message: '', stacked: true },
};

export const Mobile: Story = {
  args: {
    message: 'Your application has been submitted',
    description: 'We’ll be in touch shortly.',
    variant: 'success',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
