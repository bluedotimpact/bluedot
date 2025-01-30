import React from 'react';
import clsx from 'clsx';

export type HeroSectionProps = React.PropsWithChildren<{
  className?: string,
  title?: string,
  subtitle?: string
}>;

export const HeroSection: React.FC<HeroSectionProps> = ({
  className, title, subtitle, children,
}) => {
  return (
    <div className={clsx('hero-section bg-bluedot-darker flex flex-row justify-center items-center w-full', className)}>
      <div className="hero-section__content max-w-[865px] mb-24 mt-80">
        {children}
        {title && (
          <h1 className="hero-section__title font-sans text-white text-5xl font-[700] leading-none mb-4 text-center">{title}</h1>
        )}
        {subtitle && (
          <h2 className="hero-section__subtitle font-sans text-white text-2xl font-[500] leading-[1.25] text-center">{subtitle}</h2>
        )}
      </div>
    </div>
  );
};

export default HeroSection;
