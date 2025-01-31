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
      {/* Top margin is nav height (82px) */}
      <div className="hero-section__content max-w-[865px] mt-[82px] py-28">
        {children}
        {title && (
          <h1 className="hero-section__title text-on-dark text-center">{title}</h1>
        )}
        {subtitle && (
          <h2 className="hero-section__subtitle text-on-dark text-2xl font-[400] text-center mt-4">{subtitle}</h2>
        )}
      </div>
    </div>
  );
};

export default HeroSection;
