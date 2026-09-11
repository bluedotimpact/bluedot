import type React from 'react';
import { ClickTarget } from './ClickTarget';
import { CTALinkOrButton } from './CTALinkOrButton';
import { cn } from './utils';

const CARD_SHELL_STYLES = 'rounded-surface border border-subtle bg-raised p-6';
const CARD_HOVER_STYLES = 'transition-[border-color,box-shadow] duration-200 hover:border-strong hover:shadow-sm';
// Stretches the link's hit area over the whole card (stretched-link pattern)
const STRETCHED_LINK_STYLES = 'after:absolute after:inset-0';

export type CardShellProps = React.PropsWithChildren<{
  className?: string;
}>;

export const CardShell: React.FC<CardShellProps> = ({ className, children }) => (
  <div className={cn(CARD_SHELL_STYLES, className)}>{children}</div>
);

export type CardProps = {
  title: string;
  /** Destination of the card. Carried by the CTA when present, otherwise by the title */
  url: string;
  /** When set, renders a primary button as the card's link. Accessible name is "<ctaText>: <title>" */
  ctaText?: string;
  className?: string;
  imageSrc?: string;
  isFullWidth?: boolean;
  subtitle?: string;
};

export const Card: React.FC<CardProps> = ({
  title,
  url,
  ctaText,
  className,
  imageSrc,
  isFullWidth = false,
  subtitle,
}) => {
  return (
    <div
      className={cn(
        CARD_SHELL_STYLES,
        CARD_HOVER_STYLES,
        'relative flex flex-col gap-4',
        isFullWidth && 'md:flex-row md:items-center md:justify-between md:gap-6',
        className,
      )}
    >
      <div className={cn('flex flex-col gap-4', isFullWidth && 'md:flex-1')}>
        {imageSrc && (
          // Decorative: the title already names the card
          <img className="w-full rounded-surface object-cover" src={imageSrc} alt="" />
        )}
        <div className="text-size-sm text-secondary flex flex-col gap-3 leading-normal">
          <p className="text-size-md text-primary leading-snug font-semibold">
            {ctaText ? title : <ClickTarget url={url} className={STRETCHED_LINK_STYLES}>{title}</ClickTarget>}
          </p>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {ctaText && (
        <CTALinkOrButton
          url={url}
          aria-label={`${ctaText}: ${title}`}
          className={cn(STRETCHED_LINK_STYLES, isFullWidth && 'md:shrink-0')}
        >
          {ctaText}
        </CTALinkOrButton>
      )}
    </div>
  );
};
