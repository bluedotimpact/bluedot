import type React from 'react';
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BottomDrawerModal } from './BottomDrawerModal';
import { CTALinkOrButton } from './CTALinkOrButton';

type BottomDrawerModalDemoProps = {
  initialSize: 'fit-content' | 'fit-screen';
  title?: string;
};

const BottomDrawerModalDemo: React.FC<BottomDrawerModalDemoProps> = ({
  initialSize,
  title,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <CTALinkOrButton onClick={() => setIsOpen(true)}>
        Open Bottom Drawer ({initialSize})
      </CTALinkOrButton>
      <BottomDrawerModal isOpen={isOpen} setIsOpen={setIsOpen} initialSize={initialSize} title={title}>
        <div className="space-y-3">
          <p className="text-size-sm text-gray-600">
            <strong>Note:</strong> This is an internal component used by <code>Modal</code> and <code>OverflowMenu</code>. At
            time of writing (2025-11-18) I don't recommend using this directly in app code.
          </p>
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <p className="text-size-sm">
              <strong>fit-content:</strong> Opens to the minimum height needed to display content.
            </p>
            <p className="text-size-sm">
              <strong>fit-screen:</strong> Opens to fill most of the screen, regardless of content size.
            </p>
          </div>
          <p className="text-size-sm">
            Drag the handle at the top or swipe down to dismiss.
          </p>
        </div>
      </BottomDrawerModal>
    </div>
  );
};

const meta = {
  title: 'ui/BottomDrawerModal',
  component: BottomDrawerModalDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof BottomDrawerModalDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FitContent: Story = {
  args: {
    initialSize: 'fit-content',
    title: 'fit-content Example',
  },
};

export const FitScreen: Story = {
  args: {
    initialSize: 'fit-screen',
    title: 'fit-screen Example',
  },
};
