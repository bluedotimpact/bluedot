import type React from 'react';
import { cn } from './utils';

export const HeroH1: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children, className, ...otherProps
}) => {
  return (
    // Keeps `bluedot-h1` for the InterDisplay font-family
    // Explicit leading-tight because the text-size-xl token carries line-height 1.2.
    <h1 className={cn('bluedot-h1 text-white text-center text-size-xl leading-tight font-normal tracking-tighter', className)} {...otherProps}>{children}</h1>
  );
};

export const HeroH2: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children, className, ...otherProps
}) => {
  return (
    <h2
      className={cn('text-color-text-on-dark text-2xl font-normal text-center mt-4 leading-snug tracking-normal bluedot-h2', className)}
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
