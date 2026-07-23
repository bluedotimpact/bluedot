import type React from 'react';
import { cn } from './utils';

export const HeroH1: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children, className, ...otherProps
}) => {
  return (
    // Keeps `bluedot-h1` for the InterDisplay font-family.
    // The size classes compose the typography spec's display ramp
    // (40 → 56 → 64 → 72px) from existing tokens: 2xl/3xl/4xl each step up
    // once at the md breakpoint, so no dedicated display token is needed.
    // Explicit leading-tight because the size tokens carry their own line-heights.
    <h1 className={cn('bluedot-h1 text-white text-center text-size-2xl lg:text-size-3xl xl:text-size-4xl leading-tight font-normal tracking-tighter', className)} {...otherProps}>{children}</h1>
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
