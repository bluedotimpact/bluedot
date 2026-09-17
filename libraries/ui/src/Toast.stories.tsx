import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { Toaster } from './Toast';
import { toast, useToastStore, type ToastVariant } from './toastStore';

type DemoArgs = {
  message: string;
  description?: string;
  variant?: ToastVariant;
  stacked?: boolean;
};

const fireToast = (variant: ToastVariant, message: string, description?: string) => {
  if (variant === 'default') return toast(message, { description });
  return toast[variant](message, { description });
};

const Demo = ({ message, description, variant = 'default', stacked = false }: DemoArgs) => {
  useEffect(() => {
    useToastStore.setState({ toasts: [], queue: [], paused: false });
    if (stacked) {
      toast('First', { description: 'Oldest visible toast' });
      toast.warning('Second', { description: 'Middle of the stack' });
      toast.success('Third', { description: 'Newest toast' });
      return;
    }

    fireToast(variant, message, description);
  }, [message, description, variant, stacked]);

  return (
    <div className="p-8">
      <button
        type="button"
        className="cursor-pointer rounded border px-2 py-1 hover:opacity-80"
        onClick={() => fireToast(variant, message, description)}
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

export const Warning: Story = {
  args: {
    message: 'Your session expires in 5 minutes',
    description: 'Save your work to avoid losing changes.',
    variant: 'warning',
  },
};

/** Error toasts stay until dismissed. */
export const ErrorToast: Story = {
  args: {
    message: 'Something went wrong',
    description: 'We couldn’t submit your application. Please try again.',
    variant: 'error',
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
