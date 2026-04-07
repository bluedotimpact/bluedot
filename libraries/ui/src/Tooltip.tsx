import { type ReactNode } from 'react';
import type React from 'react';
import {
  Button,
  DialogTrigger,
  Popover,
  Dialog,
  TooltipTrigger,
  Tooltip as AriaTooltip,
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
      <Button className="cursor-pointer" aria-label={ariaLabel}>
        {children}
      </Button>
      <Popover
        placement={placement}
        offset={8}
        className={cn(
          'bg-cream-dark text-pretty text-white text-size-xs px-3 py-2 rounded-lg shadow-md max-w-2xs',
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

export type HoverTooltipProps = {
  content: ReactNode;
  children?: ReactNode;
  placement?: React.ComponentProps<typeof AriaTooltip>['placement'];
  delayInMs?: number;
  className?: string;
  ariaLabel?: string;
};

/**
 * Tooltip that opens on hover and focus (keyboard accessible), closes on mouse leave or blur.
 */
export const HoverTooltip: React.FC<HoverTooltipProps> = ({
  content,
  children = <InfoCircleIcon />,
  placement = 'top',
  delayInMs = 100,
  className,
  ariaLabel,
}) => {
  return (
    <TooltipTrigger delay={delayInMs}>
      <Button className="cursor-default" aria-label={ariaLabel}>
        {children}
      </Button>
      <AriaTooltip
        placement={placement}
        offset={8}
        className={cn(
          'bg-cream-dark text-pretty text-white text-size-xs px-3 py-2 rounded-lg shadow-md max-w-2xs',
          className,
        )}
      >
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  );
};
