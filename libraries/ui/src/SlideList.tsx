import React, { useState } from 'react';
import clsx from 'clsx';

export type SlideListProps = {
  className?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  children: React.ReactNode;
  featuredSlot?: React.ReactNode;
  itemsPerSlide?: number;
  slideClassName?: string;
  containerClassName?: string;
  slidesWrapperWidth?: string | { mobile: string; desktop: string };
};

export const SlideList: React.FC<SlideListProps> = ({
  className,
  title,
  subtitle,
  description,
  children,
  featuredSlot,
  itemsPerSlide = 1,
  slideClassName,
  containerClassName,
  slidesWrapperWidth = { mobile: '100%', desktop: '800px' },
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectiveItemsPerSlide = isMobile ? 1 : itemsPerSlide;
  const childrenArray = React.Children.toArray(children) as React.ReactElement[];
  const totalSlides = Math.ceil(childrenArray.length / effectiveItemsPerSlide);

  const handlePrevious = () => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => Math.min(totalSlides - 1, prev + 1));
  };

  const isFirstSlide = currentSlide === 0;
  const isLastSlide = currentSlide === totalSlides - 1;

  return (
    <section className={clsx('slide-list w-full', className)}>
      <div className="slide-list__header flex flex-col md:flex-row md:justify-between md:items-start mb-8">
        {(title || subtitle || description) && (
          <div className="slide-list__header-content mb-6 md:mb-0">
            {title && (
              <h2 className="slide-list__title">{title}</h2>
            )}
            {subtitle && (
              <h3 className="slide-list__subtitle">{subtitle}</h3>
            )}
            {description && (
              <p className="slide-list__description mt-4 max-w-[600px]">{description}</p>
            )}
          </div>
        )}
        {totalSlides > 1 && (
          <div className="slide-list__nav hidden md:flex items-center gap-2 pt-2 md:ml-auto">
            <SlideListBtn
              onClick={handlePrevious}
              disabled={currentSlide === 0}
              ariaLabel="Previous slide"
            >
              <svg
                className="slide-list__nav-icon size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </SlideListBtn>
            <SlideListBtn
              onClick={handleNext}
              disabled={currentSlide === totalSlides - 1}
              ariaLabel="Next slide"
            >
              <svg
                className="slide-list__nav-icon size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </SlideListBtn>
          </div>
        )}
      </div>

      <div className={clsx('slide-list__content flex flex-col md:flex-row gap-4', containerClassName)}>
        {featuredSlot && (
          <div className="slide-list__featured w-full md:w-[600px] flex-shrink-0 overflow-hidden">
            {featuredSlot}
          </div>
        )}

        {/* Mobile navigation buttons - shown below featured slot */}
        {totalSlides > 1 && (
          <div className="slide-list__nav md:hidden flex items-center justify-end gap-2 mt-4">
            <SlideListBtn
              onClick={handlePrevious}
              disabled={currentSlide === 0}
              ariaLabel="Previous slide"
            >
              <svg
                className="slide-list__nav-icon size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </SlideListBtn>
            <SlideListBtn
              onClick={handleNext}
              disabled={currentSlide === totalSlides - 1}
              ariaLabel="Next slide"
            >
              <svg
                className="slide-list__nav-icon size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </SlideListBtn>
          </div>
        )}

        <div
          className="slide-list__container relative overflow-hidden flex-shrink-0 w-full"
          style={{
            width: typeof slidesWrapperWidth === 'string'
              ? slidesWrapperWidth
              : `min(100%, ${slidesWrapperWidth.desktop})`,
          }}
        >
          <div
            className="slide-list__slides flex transition-transform duration-300"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
              gap: '0.25rem',
            }}
          >
            {React.Children.map(children, (child) => (
              <div
                className={clsx(
                  'slide-list__slide flex-shrink-0 w-full',
                  slideClassName,
                )}
                style={{ width: `${100 / effectiveItemsPerSlide}%` }}
              >
                {child}
              </div>
            ))}
          </div>

          {(!isFirstSlide || !isLastSlide) && (
            <div className="slide-list__progress absolute bottom-0 left-0 w-full">
              <div className="slide-list__progress-track h-1 bg-charcoal-normal">
                <div
                  className="slide-list__progress-bar h-full bg-bluedot-normal transition-all duration-300"
                  style={{
                    width: `${((currentSlide + 1) / totalSlides) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export const SlideItem: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => (
  <div className={clsx('size-full', className)}>
    {children}
  </div>
);

export const SlideListBtn: React.FC<{
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}> = ({
  onClick, disabled, ariaLabel, children,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      'slide-list__nav-button',
      'p-3 border rounded-lg transition-colors',
      'border-charcoal-light text-black',
      'focus:outline-none focus:ring-2 focus:ring-bluedot-light focus:ring-offset-0',
      'disabled:pointer-events-none disabled:border-charcoal-light disabled:text-charcoal-light',
      'hover:bg-bluedot-lighter hover:border-bluedot-lighter hover:text-bluedot-normal',
      'active:bg-bluedot-normal active:border-bluedot-normal active:text-black',
    )}
    aria-label={ariaLabel}
  >
    {children}
  </button>
);
