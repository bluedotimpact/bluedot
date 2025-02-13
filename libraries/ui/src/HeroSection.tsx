import React from 'react';
import clsx from 'clsx';

export type HeroH1Props = React.PropsWithChildren<{
  className?: string,
}>;

export const HeroH1: React.FC<HeroH1Props> = ({
  children, className,
}) => {
  return (
    <h1 className={clsx('hero-section__title text-on-dark text-center', className)}>{children}</h1>
  );
};

export type HeroH2Props = React.PropsWithChildren<{
  className?: string,
}>;

export const HeroH2: React.FC<HeroH2Props> = ({
  children, className,
}) => {
  return (
    <h2 className={clsx('hero-section__subtitle text-on-dark text-2xl font-[400] text-center mt-4', className)}>{children}</h2>
  );
};

type HeroCTAContainerProps = React.PropsWithChildren<{
  className?: string,
}>;

export const HeroCTAContainer: React.FC<HeroCTAContainerProps> = ({
  className,
  children,
}) => {
  return (
    <div className={clsx('flex justify-center mt-8', className)}>
      {children}
    </div>
  );
};

export type HeroSectionProps = React.PropsWithChildren<{
  className?: string,
}>;

export const HeroSection: React.FC<HeroSectionProps> = ({
  className,
  children,
}) => {
  return (
    <div className={clsx('hero-section bg-bluedot-darker flex flex-row justify-center items-center w-full px-spacing-x', className)}>
      {/* Top margin is nav height (82px) */}
      <div className="hero-section__content max-w-[865px] mt-[82px] py-16">
        {children}
      </div>
    </div>
  );
};
