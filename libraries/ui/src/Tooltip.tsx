import React, { ReactNode, useState } from 'react';
import {
  Button,
  DialogTrigger,
  Popover,
  Dialog,
  OverlayArrow,
} from 'react-aria-components';
import { cn } from './utils';

export type TooltipProps = {
  /** The content to show in the tooltip */
  content: ReactNode;
  /** The trigger element */
  children: ReactNode;
  /** Placement of the tooltip relative to the trigger */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Additional class names for the tooltip container */
  className?: string;
};

/**
 * A click-triggered tooltip (actually a popover).
 * Opens on click/tap, closes when clicking outside or pressing Escape.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        className="outline-none cursor-pointer"
        onPress={() => setIsOpen(!isOpen)}
      >
        {children}
      </Button>
      <Popover
        placement={placement}
        offset={8}
        className={cn(
          'bg-gray-900 text-white text-size-xs px-3 py-2 rounded-lg shadow-lg max-w-xs',
          className,
        )}
      >
        <OverlayArrow>
          <svg
            width={12}
            height={12}
            viewBox="0 0 12 12"
            className="fill-gray-900"
          >
            {placement === 'bottom' && (
              <path d="M0 12L6 0L12 12" />
            )}
            {placement === 'top' && (
              <path d="M0 0L6 12L12 0" />
            )}
            {placement === 'left' && (
              <path d="M0 0L12 6L0 12" />
            )}
            {placement === 'right' && (
              <path d="M12 0L0 6L12 12" />
            )}
          </svg>
        </OverlayArrow>
        <Dialog className="outline-none">
          {content}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
};
