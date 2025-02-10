import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

export type SlideListProps = {
  className?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  children: React.ReactNode;
  featuredSlot?: React.ReactNode;
  maxItemsPerSlide?: number;
  slideClassName?: string;
  containerClassName?: string;
  minItemWidth?: number;
};

export const SlideList: React.FC<SlideListProps> = ({
  className,
  title,
  subtitle,
  description,
  children,
  featuredSlot,
  maxItemsPerSlide = 1,
  slideClassName,
  containerClassName,
  minItemWidth = 340,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [measuredContainerWidth, setMeasuredContainerWidth] = useState<number | null>(null);
  const containerWidth = measuredContainerWidth ?? 800; // Fall back to a guess that will usually make the whole list display on desktop
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const cleanup = () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };

    if (!containerRef.current) return cleanup;

    if (measuredContainerWidth === null && containerRef.current) {
      setMeasuredContainerWidth(containerRef.current.getBoundingClientRect().width);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setMeasuredContainerWidth(entry.contentRect.width);
      });
    });
    resizeObserver.observe(containerRef.current);

    return cleanup;
  }, []);

  const itemsFit = Math.max(1, Math.floor(containerWidth / minItemWidth));
  const itemsPerSlide = Math.max(1, Math.min(itemsFit, maxItemsPerSlide));

  const childrenArray = React.Children.toArray(children) as React.ReactElement[];
  const totalSlides = Math.ceil(childrenArray.length / itemsPerSlide);

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
      <div className="slide-list__header flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8">
        {(title || subtitle || description) && (
          <div className="slide-list__header-content mb-6 lg:mb-0">
            {title && (
              <h2 className="slide-list__title text-2xl font-bold">{title}</h2>
            )}
            {subtitle && (
              <h3 className="slide-list__subtitle text-xl">{subtitle}</h3>
            )}
            {description && (
              <p className="slide-list__description mt-4 max-w-[600px] text-gray-700">{description}</p>
            )}
          </div>
        )}
        {totalSlides > 1 && (
          <div className="slide-list__nav hidden lg:flex items-center gap-2 pt-2 lg:ml-auto">
            <SlideListBtn
              onClick={handlePrevious}
              disabled={isFirstSlide}
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

      <div className={clsx('slide-list__content flex flex-col lg:flex-row gap-4', containerClassName)}>
        {featuredSlot && (
          <div className="slide-list__featured w-full lg:w-[600px] flex-shrink-0 overflow-hidden">
            {featuredSlot}
          </div>
        )}

        {totalSlides > 1 && (
          <div className="slide-list__nav lg:hidden flex items-center justify-end gap-2 mt-4">
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
          ref={containerRef}
          className="slide-list__container relative overflow-hidden flex-1 flex flex-col gap-6"
        >
          <div
            className="slide-list__slides flex transition-transform duration-300"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
            }}
          >
            {React.Children.map(children, (child) => (
              <div
                className={clsx(
                  'slide-list__slide flex-shrink-0 w-full',
                  slideClassName,
                )}
                style={{ width: `${100 / itemsPerSlide}%` }}
              >
                {child}
              </div>
            ))}
          </div>

          {(!isFirstSlide || !isLastSlide) && (
            <div className="slide-list__progress w-full">
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
      'hover:bg-gray-50',
      'active:bg-gray-100',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'focus:outline-none focus:ring-2 focus:ring-bluedot-light',
    )}
    aria-label={ariaLabel}
  >
    {children}
  </button>
);
