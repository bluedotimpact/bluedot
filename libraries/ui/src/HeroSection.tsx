import type React from 'react';
import { cn } from './utils';

export type HeroMiniTitleProps = React.PropsWithChildren<{
  className?: string;
}>;

export const HeroMiniTitle: React.FC<HeroMiniTitleProps> = ({
  children, className,
}) => {
  return (
    <div className={cn('text-color-text-on-dark text-center uppercase tracking-wider text-sm font-semibold mb-4', className)}>{children}</div>
  );
};

export const HeroH1: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children, className, ...otherProps
}) => {
  return (
    // Keeps `bluedot-h1` for the InterDisplay font-family
    // Display ramp (40 → 56 → 64 → 72) is deliberately arbitrary px, not a text-size-* token.
    // eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size
    <h1 className={cn('bluedot-h1 text-color-text-on-dark text-center text-[40px] md:text-[56px] lg:text-[64px] xl:text-[72px] font-normal leading-tight tracking-tighter', className)} {...otherProps}>{children}</h1>
  );
};

export const HeroH2: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children, className, ...otherProps
}) => {
  return (
    <h2
      className={cn('text-color-text-on-dark text-2xl font-normal text-center mt-4 bluedot-h2', className)}
      {...otherProps}
    >
      {children}
    </h2>
  );
};

export type HeroCTAContainerProps = React.PropsWithChildren<{
  className?: string;
}>;

export const HeroCTAContainer: React.FC<HeroCTAContainerProps> = ({
  className,
  children,
}) => {
  return (
    <div className={cn('flex justify-center mt-8', className)}>
      {children}
    </div>
  );
};

export type HeroSectionProps = React.PropsWithChildren<{
  className?: string;
}>;

export const HeroSection: React.FC<HeroSectionProps> = ({
  className,
  children,
}) => {
  return (
    <div className={cn('bg-bluedot-darker flex flex-row justify-center items-center w-full px-spacing-x', className)}>
      <div className="max-w-[920px] py-12">
        {children}
      </div>
    </div>
  );
};
