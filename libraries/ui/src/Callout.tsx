import type React from 'react';
import { CTALinkOrButton, type CTALinkOrButtonProps } from './CTALinkOrButton';
import { IconButton } from './IconButton';
import { CloseIcon } from './icons/CloseIcon';
import { TONE_STYLES, type Tone } from './toneStyles';
import { cn } from './utils';

export type CalloutTone = Tone;

export type CalloutAction = {
  label: string;
  emphasis?: 'primary' | 'secondary';
} & Omit<CTALinkOrButtonProps, 'variant' | 'size' | 'children' | 'className' | 'style'>;

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
              <CTALinkOrButton
                key={label}
                variant="unstyled"
                size="small"
                className={cn('grow', ACTION_STYLES[emphasis][tone])}
                {...action}
              >
                {label}
              </CTALinkOrButton>
            ))}
          </div>
        )}
      </div>
      {onDismiss && (
        <IconButton aria-label="Dismiss" onClick={onDismiss} className={cn('-my-1.5 -mr-1.5', fg)}>
          <CloseIcon size={16} aria-hidden="true" />
        </IconButton>
      )}
    </div>
  );
};

const ACTION_STYLES: Record<'primary' | 'secondary', Record<CalloutTone, string>> = {
  primary: {
    info: 'bg-info-fg text-on-dark hover:bg-accent-hover',
    success: 'bg-success-fg text-on-dark hover:bg-success-fg-hover',
    warning: 'bg-warning-fg text-on-dark hover:bg-warning-fg-hover',
    error: 'bg-error-fg text-on-dark hover:bg-error-fg-hover',
  },
  secondary: {
    info: 'border border-info-fg text-info-fg hover:bg-info-fg/10',
    success: 'border border-success-fg text-success-fg hover:bg-success-fg/10',
    warning: 'border border-warning-fg text-warning-fg hover:bg-warning-fg/10',
    error: 'border border-error-fg text-error-fg hover:bg-error-fg/10',
  },
};
