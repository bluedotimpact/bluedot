import { type ReactNode } from 'react';
import type React from 'react';
import {
  Button,
  DialogTrigger,
  Popover,
  Dialog,
  OverlayArrow,
} from 'react-aria-components';
import { cn } from './utils';
import { InfoCircleIcon } from './icons/InfoCircleIcon';

export type TooltipProps = {
  content: ReactNode;
  /** Accessible name for the trigger and the bubble, e.g. "Show certificate eligibility information". */
  'aria-label': string;
  /** Custom trigger content. Must not be interactive: it renders inside the trigger button. */
  children?: ReactNode;
  placement?: React.ComponentProps<typeof Popover>['placement'];
  className?: string;
};

/**
 * Tooltip: opens on click/tap or Enter/Space, never on hover. Escape or an outside click closes it.
 * Placement flips automatically when it would collide with the viewport edge.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  'aria-label': ariaLabel,
  children = <InfoCircleIcon />,
  placement = 'top',
  className,
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
        offset={12}
        className={cn(
          'group bg-dark text-on-dark text-size-xs leading-normal text-pretty px-3 py-2 rounded-surface shadow-md max-w-2xs',
          className,
        )}
      >
        <OverlayArrow>
          <svg
            aria-hidden="true"
            width={12}
            height={12}
            viewBox="0 0 12 12"
            className="block fill-dark group-data-[placement=bottom]:rotate-180 group-data-[placement=left]:-rotate-90 group-data-[placement=right]:rotate-90"
          >
            <path d="M0 0 12 0 6 6Z" />
          </svg>
        </OverlayArrow>
        <Dialog aria-label={ariaLabel}>
          {content}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
};
