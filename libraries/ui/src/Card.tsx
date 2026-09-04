import type React from 'react';
import clsx from 'clsx';
import { CTALinkOrButton } from './CTALinkOrButton';
import { Tag } from './Tag';

const CARD_SHELL_STYLES = 'rounded-lg border border-bluedot-navy/10 bg-white p-6';

export type CardProps = {
  title: string;
  /** The whole card is a single link to this destination */
  url: string;
  /**
   * Body slot. Rendered inside the card link — must not contain interactive
   * elements (links, buttons); use `ctaText` for the action affordance.
   */
  children?: React.ReactNode;
  className?: string;
  /** Presentational primary-button affordance; navigates to `url` like the rest of the card */
  ctaText?: string;
  imageSrc?: string;
  isFullWidth?: boolean;
  subtitle?: string;
  subtitleBadge?: string;
};

export const Card: React.FC<CardProps> = ({
  title,
  url,
  children,
  className,
  ctaText,
  imageSrc,
  isFullWidth = false,
  subtitle,
  subtitleBadge,
}) => {
  return (
    <ClickTarget
      url={url}
      className={cn(
        CARD_SHELL_STYLES,
        'flex transition-shadow duration-200 hover:shadow-sm',
        'focus-visible:outline-bluedot-normal focus-visible:outline-2 focus-visible:outline-offset-2',
        isFullWidth ? 'w-full flex-col md:flex-row md:items-center md:justify-between md:gap-6' : 'flex-col',
        className,
      )}
    >
      <div className={cn('flex flex-col gap-4', isFullWidth && 'md:flex-1')}>
        {imageSrc && (
          // Decorative: the card's accessible name is the title text
          <img className="w-full rounded-lg object-cover" src={imageSrc} alt="" />
        )}
        <div className="text-size-sm text-bluedot-navy/70 flex flex-col gap-3 leading-normal">
          <div className="flex flex-row items-center gap-2">
            <p className="text-size-md text-bluedot-navy leading-[1.3] font-semibold">{title}</p>
            {subtitleBadge && <Tag variant="secondary">{subtitleBadge}</Tag>}
          </div>
          {subtitle && <p>{subtitle}</p>}
          {children}
        </div>
      </div>
      {ctaText && (
        <span
          className={cn(
            'bg-bluedot-normal text-size-sm bd-md:text-size-xs mt-4 flex w-fit items-center justify-center rounded-sm px-4 py-3 font-semibold whitespace-nowrap text-white',
            isFullWidth && 'md:mt-0 md:shrink-0',
          )}
        >
          {ctaText}
        </span>
      )}
    </ClickTarget>
  );
};
