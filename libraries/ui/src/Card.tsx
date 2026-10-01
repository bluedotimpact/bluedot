import type React from 'react';
import { CTALinkOrButton } from './CTALinkOrButton';
import { cn } from './utils';

const CARD_SHELL_STYLES = 'rounded-surface border border-subtle bg-raised p-6';
const CARD_HOVER_STYLES = 'transition-[border-color,box-shadow] duration-200 hover:border-strong hover:shadow-sm';

export type CardShellProps = React.PropsWithChildren<{
  className?: string;
}>;

export const CardShell: React.FC<CardShellProps> = ({ className, children }) => (
  <div className={cn(CARD_SHELL_STYLES, className)}>{children}</div>
);

export type CardProps = {
  title: string;
  /** Destination of the CTA. Its hit area is stretched over the whole card */
  url: string;
  /** The card's link. Accessible name is "<ctaText>: <title>" */
  ctaText: string;
  className?: string;
  imageSrc?: string;
  subtitle?: string;
};

export const Card: React.FC<CardProps> = ({
  title,
  url,
  ctaText,
  className,
  imageSrc,
  subtitle,
}) => {
  return (
    <div
      className={cn(
        CARD_SHELL_STYLES,
        CARD_HOVER_STYLES,
        'relative flex flex-col gap-4',
        className,
      )}
    >
      <div className="flex flex-col gap-4">
        {imageSrc && (
          // Decorative: the title already names the card
          <img className="w-full rounded-surface object-cover" src={imageSrc} alt="" />
        )}
        <div className="text-size-sm text-secondary flex flex-col gap-3 leading-normal">
          <p className="text-size-md text-primary leading-snug font-semibold">{title}</p>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <CTALinkOrButton
        url={url}
        aria-label={`${ctaText}: ${title}`}
        // Stretched link: the ::after covers the card so the whole surface is the hit area
        className="after:absolute after:inset-0"
      >
        {ctaText}
      </CTALinkOrButton>
    </div>
  );
};
