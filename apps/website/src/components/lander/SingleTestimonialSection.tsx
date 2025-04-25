import React, { ReactNode } from 'react';
import { CTALinkOrButton } from '@bluedot/ui';
import clsx from 'clsx';
import { P } from '../Text';

interface TestimonialQuoteProps {
  children: ReactNode;
  className?: string;
}

/**
 * TestimonialQuote component - displays the testimonial quote text
 */
export const TestimonialQuote: React.FC<TestimonialQuoteProps> = ({
  children,
  className = '',
}) => (
  /* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */
  <P className={`font-serif text-size-lg md:text-3xl mb-3 md:mr-20 ${className}`}>
    "{children}"
  </P>
);

interface TestimonialAttributionProps {
  children: ReactNode;
  className?: string;
}

/**
 * TestimonialAttribution component - displays the testimonial attribution
 */
export const TestimonialAttribution: React.FC<TestimonialAttributionProps> = ({
  children,
  className = '',
}) => (
  <P className={`font-serif text-size-sm md:text-size-md text-gray-800 md:mr-20 ${className}`}>
    {children}
  </P>
);

interface TestimonialCTAProps {
  url: string;
  className?: string;
  children: ReactNode;
}

/**
 * TestimonialCTA component - displays the call-to-action button
 */
export const TestimonialCTA: React.FC<TestimonialCTAProps> = ({
  url,
  className = '',
  children,
}) => (
  <>
    {/* Desktop CTA - The mr-50 here is to allow centering the CTA button, compared to the size-50 profile pic on the left */}
    <div className="flex justify-center mr-24 md:mr-50">
      <CTALinkOrButton url={url} className={`mt-7 ${className}`}>
        {children}
      </CTALinkOrButton>
    </div>
  </>
);

interface SingleTestimonialSectionProps {
  imgSrc: string;
  children: ReactNode;
  className?: string;
}

/**
 * Displays a single testimonial with a CTA button using compound component pattern
 */
const SingleTestimonialSection: React.FC<SingleTestimonialSectionProps> = ({
  imgSrc,
  children,
  className,
}) => {
  return (
    <div className={clsx('flex items-start gap-4 md:gap-8 flex-wrap sm:flex-nowrap', className)}>
      <img
        src={imgSrc}
        alt=""
        className="size-24 md:size-50 rounded-full object-cover shrink-0"
      />
      <div>
        {children}
      </div>
    </div>
  );
};

export default SingleTestimonialSection;
