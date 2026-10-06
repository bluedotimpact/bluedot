import type React from 'react';
import { FaXmark } from 'react-icons/fa6';
import { Button, type ButtonProps } from './Button';
import { IconButton } from './IconButton';
import { TONE_STYLES, type Tone } from './toneStyles';
import { cn } from './utils';

export type CalloutTone = Tone;

export type CalloutAction = {
  label: string;
  emphasis?: 'primary' | 'secondary';
} & Omit<ButtonProps, 'variant' | 'tone' | 'size' | 'children' | 'className' | 'style'>;

export type CalloutProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  tone?: CalloutTone;
  title?: React.ReactNode;
  actions?: CalloutAction[];
  // Renders a close button; the caller owns hiding the callout and remembering the dismissal
  onDismiss?: () => void;
};

export const Callout = ({
  tone = 'info',
  title,
  actions = [],
  onDismiss,
  className,
  children,
  ...rest
}: CalloutProps) => {
  const { surface, fg, Icon } = TONE_STYLES[tone];
  const hasActions = actions.length > 0;

  return (
    <div {...rest} className={cn('flex items-start gap-3 rounded-surface border p-4', surface, className)}>
      <Icon size={20} className={cn('mt-px shrink-0', fg)} aria-hidden="true" />
      {/* Figma: actions stay beside the body while it keeps 220px, then wrap below it and fill the width */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <div className="flex min-w-0 grow-[999] basis-[220px] flex-col gap-0.5 break-words">
          {title && <p className={cn('text-size-sm font-semibold leading-snug', fg)}>{title}</p>}
          {children && <div className="text-size-xs leading-normal text-primary [&>*+*]:mt-2">{children}</div>}
        </div>
        {hasActions && (
          <div className="flex grow flex-wrap gap-2">
            {actions.map(({ label, emphasis = 'primary', ...action }) => (
              <Button
                key={label}
                variant={emphasis}
                tone={ACTION_TONES[tone]}
                size="small"
                className="grow"
                {...action}
              >
                {label}
              </Button>
            ))}
          </div>
        )}
      </div>
      {onDismiss && (
        <IconButton aria-label="Dismiss" onClick={onDismiss} className={cn('-my-1.5 -mr-1.5', fg)}>
          <FaXmark aria-hidden="true" className="size-4" />
        </IconButton>
      )}
    </div>
  );
};

// info/fg is the brand accent, so info actions are plain buttons
const ACTION_TONES: Record<CalloutTone, ButtonProps['tone']> = {
  info: undefined,
  success: 'success',
  warning: 'warning',
  error: 'destructive',
};
