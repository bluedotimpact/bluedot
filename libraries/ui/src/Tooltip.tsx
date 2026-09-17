import { type ReactNode } from 'react';
import type React from 'react';
import {
  Button,
  DialogTrigger,
  Popover,
  Dialog,
} from 'react-aria-components';
import { cn } from './utils';
import { InfoCircleIcon } from './icons/InfoCircleIcon';

export type TooltipProps = {
  content: ReactNode;
  children?: ReactNode;
  placement?: React.ComponentProps<typeof Popover>['placement'];
  className?: string;
  ariaLabel?: string;
};

/**
 * Tooltip that opens on click/tap (not hover), closes when clicking outside or pressing Escape.
 * Placement flips automatically when it would collide with the viewport edge.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children = <InfoCircleIcon />,
  placement = 'top',
  className,
  ariaLabel = 'Show info tooltip',
}) => {
  return (
    <DialogTrigger>
      <Button
        aria-label={ariaLabel}
        className={cn(
          'relative inline-flex cursor-pointer rounded-full text-secondary',
          // Extends the tap target to 24x24 around the 16px icon without changing the inline footprint
          'before:absolute before:-inset-1',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        )}
      >
        {children}
      </Button>
      <Popover
        placement={placement}
        offset={8}
        className={cn(
          'bg-dark text-on-dark text-size-xs leading-normal text-pretty px-3 py-2 rounded-surface shadow-md max-w-2xs',
          className,
        )}
      >
        <Dialog>
          {content}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
};
