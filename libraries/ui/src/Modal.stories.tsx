import type React from 'react';
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal, type ModalProps } from './Modal';
import { ModalTitle } from './ModalTitle';
import { Button } from './Button';
import { Input } from './Input';
import { P } from './Text';

type ModalDemoProps = Omit<ModalProps, 'isOpen' | 'setIsOpen' | 'children'> & {
  children?: React.ReactNode;
  initialOpen?: boolean;
  openLabel?: string;
};

const ModalDemo: React.FC<ModalDemoProps> = ({
  initialOpen = false,
  openLabel = 'Open modal',
  children,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>{openLabel}</Button>
      <Modal isOpen={isOpen} setIsOpen={setIsOpen} {...props}>
        {children}
      </Modal>
    </div>
  );
};

const meta = {
  title: 'ui/Modal',
  component: ModalDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    title: { control: 'text' },
    children: { control: 'text' },
    initialOpen: { control: 'boolean' },
    isDismissable: { control: 'boolean' },
    bottomDrawerOnMobile: { control: 'boolean' },
  },
} satisfies Meta<typeof ModalDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Leave course',
    initialOpen: true,
    bottomDrawerOnMobile: true,
    children: (
      <div className="flex flex-col gap-6">
        <P>You'll lose access to your discussion group and your progress. This can't be undone.</P>
        <Button className="w-full">Confirm drop out</Button>
      </div>
    ),
  },
};

export const LongTitle: Story = {
  args: {
    ...Default.args,
    title: 'A long title that wraps onto a second line and still stays centred on the card',
  },
};

export const LongContent: Story = {
  args: {
    title: 'Terms of participation',
    initialOpen: true,
    bottomDrawerOnMobile: true,
    children: (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 12 }, (_, i) => (
          <P key={i}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies, nunc nisl
            aliquet nunc, quis aliquam nisl nunc quis nisl. Nullam euismod, nisl eget aliquam ultricies.
          </P>
        ))}
        <Button className="w-full">I agree</Button>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'The header stays fixed and the body scrolls; the card never exceeds the viewport.',
      },
    },
  },
};

export const WithForm: Story = {
  args: {
    title: 'Change email',
    initialOpen: true,
    bottomDrawerOnMobile: true,
    children: (
      <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-2">
          <label htmlFor="story-email" className="font-semibold">New email</label>
          <Input id="story-email" type="email" />
        </div>
        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <Button variant="secondary" className="w-full md:w-auto">Cancel</Button>
          <Button type="submit" className="w-full md:w-auto">Send confirmation</Button>
        </div>
      </form>
    ),
  },
};

export const NotDismissable: Story = {
  render() {
    const NotDismissableDemo = () => {
      const [isOpen, setIsOpen] = useState(true);

      return (
        <div>
          <Button onClick={() => setIsOpen(true)}>Open non-dismissable modal</Button>
          <Modal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            title="Deletion requested"
            bottomDrawerOnMobile
            isDismissable={false}
          >
            <div className="flex flex-col gap-6">
              <P>
                With <code>isDismissable={'{false}'}</code> there is no close button, and backdrop click, Escape and
                dragging the sheet do nothing. The body supplies the exit, or the caller closes it by setting{' '}
                <code>isOpen</code> to false.
              </P>
              <Button onClick={() => setIsOpen(false)}>Close programmatically</Button>
            </div>
          </Modal>
        </div>
      );
    };

    return <NotDismissableDemo />;
  },
};

export const StateSwap: Story = {
  render() {
    const StateSwapDemo = () => {
      const [isOpen, setIsOpen] = useState(true);
      const [done, setDone] = useState(false);

      return (
        <div>
          <Button
            onClick={() => {
              setDone(false);
              setIsOpen(true);
            }}
          >
            Open modal
          </Button>
          <Modal isOpen={isOpen} setIsOpen={setIsOpen} title={done ? 'You’ve rejoined Group 4' : 'Rejoin a group'} bottomDrawerOnMobile>
            <div className="flex flex-col gap-6">
              <P>
                {done
                  ? 'We’ve emailed you the calendar invite. Your next discussion is Thursday at 6 PM.'
                  : 'Pick a group that fits your availability. You’ll keep your progress and exercise answers.'}
              </P>
              {done
                ? <Button className="w-full" onClick={() => setIsOpen(false)}>Done</Button>
                : <Button className="w-full" onClick={() => setDone(true)}>Rejoin group</Button>}
            </div>
          </Modal>
        </div>
      );
    };

    return <StateSwapDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'One modal moves through confirm → success in place. When the string title changes, focus moves to the new heading so screen readers announce the new state.',
      },
    },
  },
};

export const CustomTitle: Story = {
  args: {
    initialOpen: true,
    bottomDrawerOnMobile: true,
    title: (
      <div className="flex items-center gap-3">
        <span aria-hidden className="size-8 rounded-full bg-accent-subtle" />
        <ModalTitle>Alex Participant</ModalTitle>
        <button type="button" className="ml-auto text-size-xs font-medium text-secondary underline underline-offset-[3px]">
          Skip
        </button>
      </div>
    ),
    ariaLabel: 'Participant feedback',
    children: <P>A ReactNode title owns its own layout; the close button still sits at the trailing edge.</P>,
  },
};
