import { ReactNode } from 'react';
import { CTALinkOrButton } from '@bluedot/ui';
import clsx from 'clsx';
import { P } from '../Text';

type QuoteProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Quote component - displays the testimonial quote text
 */
const Quote = ({
  children,
  className = '',
}: QuoteProps) => (
  <P className={`font-serif text-size-lg md:text-3xl mb-3 md:mr-20 ${className}`}>
    "{children}"
  </P>
);

type AttributionProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Attribution component - displays the testimonial attribution
 */
const Attribution = ({
  children,
  className = '',
}: AttributionProps) => (
  <P className={`font-serif text-size-sm md:text-size-md text-gray-800 md:mr-20 ${className}`}>
    {children}
  </P>
);

type CTAProps = {
  url: string;
  className?: string;
  children: ReactNode;
};

/**
 * CTA component - displays the call-to-action button
 */
const CTA = ({
  url,
  className = '',
  children,
}: CTAProps) => (
  <>
    {/* Desktop CTA - The mr-50 here is to allow centering the CTA button, compared to the size-50 profile pic on the left */}
    <div className="flex justify-center mr-24 md:mr-50">
      <CTALinkOrButton url={url} className={`mt-7 ${className}`}>
        {children}
      </CTALinkOrButton>
    </div>
  </>
);

type SingleTestimonialProps = {
  imgSrc: string;
  children: ReactNode;
  className?: string;
};

/**
 * Displays a single testimonial with a CTA button using compound component pattern
 */
const SingleTestimonial = ({
  imgSrc,
  children,
  className,
}: SingleTestimonialProps) => {
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

// Attach subcomponents
SingleTestimonial.Quote = Quote;
SingleTestimonial.Attribution = Attribution;
SingleTestimonial.CTA = CTA;

// Export the component
export default SingleTestimonial;
