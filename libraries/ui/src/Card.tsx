import type React from 'react';
import { ClickTarget } from './ClickTarget';
import { CTALinkOrButton } from './CTALinkOrButton';
import { Tag } from './Tag';
import { cn } from './utils';

const CARD_SHELL_STYLES = 'rounded-surface border border-subtle bg-raised p-6';
// Only clickable shells get hover/focus affordances
const CARD_HOVER_STYLES = 'transition-[border-color,box-shadow] duration-200 hover:border-strong hover:shadow-sm';
const CARD_FOCUS_STYLES = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

export type CardShellProps = React.PropsWithChildren<{
  className?: string;
  /** When set, the whole shell is a single link and gains hover/focus affordances */
  url?: string;
}>;

export const CardShell: React.FC<CardShellProps> = ({ className, url, children }) => {
  if (url) {
    return (
      <ClickTarget url={url} className={cn(CARD_SHELL_STYLES, CARD_HOVER_STYLES, CARD_FOCUS_STYLES, className)}>
        {children}
      </ClickTarget>
    );
  }

  return <div className={cn(CARD_SHELL_STYLES, className)}>{children}</div>;
};

export type CardProps = {
  title: string;
  /** Destination of the CTA. Its hit area is stretched over the whole card (stretched-link pattern) */
  url: string;
  /** The card's only real link; its label is the card's accessible name */
  ctaText: string;
  /** Body slot. Sits under the stretched CTA, so keep it non-interactive */
  children?: React.ReactNode;
  className?: string;
  imageSrc?: string;
  isFullWidth?: boolean;
  subtitle?: string;
  subtitleBadge?: string;
};

export const Card: React.FC<CardProps> = ({
  title,
  url,
  ctaText,
  children,
  className,
  imageSrc,
  isFullWidth = false,
  subtitle,
  subtitleBadge,
}) => {
  return (
    <CardShell
      className={cn(
        'relative flex',
        CARD_HOVER_STYLES,
        isFullWidth ? 'w-full flex-col md:flex-row md:items-center md:justify-between md:gap-6' : 'flex-col',
        className,
      )}
    >
      <div className={cn('flex flex-col gap-4', isFullWidth && 'md:flex-1')}>
        {imageSrc && (
          // Decorative: the card's accessible name is the CTA text
          <img className="w-full rounded-surface object-cover" src={imageSrc} alt="" />
        )}
        <div className="text-size-sm text-secondary flex flex-col gap-3 leading-normal">
          <div className="flex flex-row items-center gap-2">
            <p className="text-size-md text-primary leading-snug font-semibold">{title}</p>
            {subtitleBadge && <Tag variant="secondary">{subtitleBadge}</Tag>}
          </div>
          {subtitle && <p>{subtitle}</p>}
          {children}
        </div>
      </div>
      <CTALinkOrButton
        url={url}
        className={cn('mt-4 after:absolute after:inset-0', isFullWidth && 'md:mt-0 md:shrink-0')}
      >
        {ctaText}
      </CTALinkOrButton>
    </CardShell>
  );
};
