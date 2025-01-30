import React from 'react';
import clsx from 'clsx';
import { CTALinkOrButton } from './CTALinkOrButton';

export type SectionProps = React.PropsWithChildren<{
  className?: string,
  title: string,
  subtitle?: string,
  ctaText?: string,
  ctaUrl?: string,
}>;

export const Section: React.FC<SectionProps> = ({
  className, title, subtitle, ctaText, ctaUrl, children,
}) => {
  return (
    <div className={clsx('section mx-16 my-8 max-w-full overflow-hidden', className)}>
      <div className="section__title-container ml-4 flex justify-between items-center gap-4">
        <div className="section__content flex-1">
          <h2 className={clsx(
            'section__title text-bluedot-normal text-[48px] mb-4 font-serif font-extrabold leading-none relative',
            "after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:ml-8 after:h-[2px] after:bg-bluedot-normal",
            ctaText && ctaUrl
              ? 'after:w-4/5'
              : 'after:w-full',
          )}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="section__subtitle text-bluedot-darker text-md mb-4">{subtitle}</p>
          )}
        </div>
        {ctaText && ctaUrl && (
          <CTALinkOrButton
            variant="secondary"
            url={ctaUrl}
            withChevron
            className="section__cta shrink-0"
          >
            {ctaText}
          </CTALinkOrButton>
        )}
      </div>
      <div className="section__body">
        {children}
      </div>
    </div>
  );
};

export default Section;
