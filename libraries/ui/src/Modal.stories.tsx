import type React from 'react';
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';
import { CTALinkOrButton } from './CTALinkOrButton';

// Wrapper component to handle the modal state
type ModalDemoProps = {
  title?: string;
  children?: React.ReactNode;
  initialOpen?: boolean;
};

const ModalDemo: React.FC<ModalDemoProps> = ({
  title = 'Modal Title',
  children = 'Modal Content',
  initialOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div>
      <CTALinkOrButton onClick={() => setIsOpen(true)}>Open Modal</CTALinkOrButton>
      <Modal isOpen={isOpen} setIsOpen={setIsOpen} title={title}>
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
  },
} satisfies Meta<typeof ModalDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Modal Title',
    children: 'This is the modal content.',
  },
};

export const LongContent: Story = {
  render() {
    const LongContentDemo = () => {
      const [isOpen, setIsOpen] = useState(false);

      return (
        <div>
          <CTALinkOrButton onClick={() => setIsOpen(true)}>Open Modal with Long Content</CTALinkOrButton>
          <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Modal with Long Content">
            <div>
              <p>This modal contains a longer content section to demonstrate scrolling behavior.</p>
              <p className="mt-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc quis nisl. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc quis nisl.</p>
              <p className="mt-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc quis nisl. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc quis nisl.</p>
              <p className="mt-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc quis nisl. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc quis nisl.</p>
            </div>
          </Modal>
        </div>
      );
    };

    return <LongContentDemo />;
  },
};

export const WithFormContent: Story = {
  render() {
    const WithFormContentDemo = () => {
      const [isOpen, setIsOpen] = useState(false);

      return (
        <div>
          <CTALinkOrButton onClick={() => setIsOpen(true)}>Open Form Modal</CTALinkOrButton>
          <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Form Modal">
            <div>
              <div className="mb-4">
                <label htmlFor="name" className="block text-size-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-size-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <CTALinkOrButton className="bg-gray-100 text-gray-700" onClick={() => {}}>Cancel</CTALinkOrButton>
                <CTALinkOrButton onClick={() => {}}>Submit</CTALinkOrButton>
              </div>
            </div>
          </Modal>
        </div>
      );
    };

    return <WithFormContentDemo />;
  },
};

export const InitiallyOpen: Story = {
  args: {
    title: 'Initially Open Modal',
    children: 'This modal is open by default when the story loads.',
    initialOpen: true,
  },
};

export const CustomTitle: Story = {
  args: {
    title: 'Custom Modal Title with a Very Long Name That Might Wrap',
    children: 'This modal demonstrates how a long title is displayed.',
  },
};

export const BottomDrawerOnMobile: Story = {
  render() {
    const BottomDrawerOnMobileDemo = () => {
      const [isOpen, setIsOpen] = useState(false);

      return (
        <div>
          <CTALinkOrButton onClick={() => setIsOpen(true)}>Open Bottom Drawer Modal</CTALinkOrButton>
          <Modal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            title="Bottom Drawer Modal"
            bottomDrawerOnMobile
          >
            <div className="max-w-[600px]">
              <p className="mb-4">
                This modal uses the <code>bottomDrawerOnMobile</code> prop.
                On mobile devices (width &lt; 768px), it appears as a bottom drawer that can be dragged.
                On desktop, it appears as a regular centered modal.
              </p>
              <p className="mb-4">
                <strong>Try resizing your browser window</strong> or viewing this on a mobile device
                to see the different behaviors.
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Features on mobile:</h3>
                <ul className="list-disc list-inside space-y-1 text-size-sm">
                  <li>Slides up from bottom</li>
                  <li>Drag handle at the top</li>
                  <li>Can be dragged to dismiss</li>
                </ul>
              </div>
            </div>
          </Modal>
        </div>
      );
    };

    return <BottomDrawerOnMobileDemo />;
  },
};
