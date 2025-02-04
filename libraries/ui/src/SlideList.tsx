import React, { useState } from 'react';
import clsx from 'clsx';

export type SlideListProps = {
  className?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  featuredSlot?: React.ReactNode;
  itemsPerSlide?: number;
  slideClassName?: string;
  containerClassName?: string;
  slidesWrapperWidth?: string;
};

export const SlideList: React.FC<SlideListProps> = ({
  className,
  title,
  description,
  children,
  featuredSlot,
  itemsPerSlide = 1,
  slideClassName,
  containerClassName,
  slidesWrapperWidth = '800px',
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const childrenArray = React.Children.toArray(children);
  const totalSlides = Math.ceil(childrenArray.length / itemsPerSlide);

  const handlePrevious = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  return (
    <section className={clsx('slide-list w-full', className)}>
      <div className="slide-list__header flex justify-between items-start mb-8">
        <div className="slide-list__header-content">
          <h2 className="slide-list__title text-4xl font-bold text-bluedot-darker">{title}</h2>
          {description && (
            <p className="slide-list__description mt-4 text-lg text-bluedot-black">{description}</p>
          )}
        </div>
        <div className="slide-list__nav flex gap-2 pt-2">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={totalSlides <= 1}
            className={clsx(
              'slide-list__nav-button slide-list__nav-button--prev',
              'p-3 border rounded-lg transition-colors',
              'border-gray-80 text-black',
              'focus:outline-none focus:ring-2 focus:ring-bluedot-light focus:ring-offset-0',
              'disabled:pointer-events-none disabled:border-gray-80 disabled:text-gray-80',
              'hover:bg-bluedot-lighter hover:border-bluedot-lighter hover:text-bluedot-normal',
              'active:bg-bluedot-normal active:border-bluedot-normal active:text-black',
            )}
            aria-label="Previous slide"
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
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={totalSlides <= 1}
            className={clsx(
              'slide-list__nav-button slide-list__nav-button--next',
              'p-3 border rounded-lg transition-colors',
              'border-gray-80 text-black',
              'focus:outline-none focus:ring-2 focus:ring-bluedot-light',
              'disabled:pointer-events-none disabled:border-gray-80 disabled:text-gray-80',
              'hover:bg-bluedot-lighter hover:border-bluedot-lighter hover:text-bluedot-normal',
              'active:bg-bluedot-normal active:border-bluedot-normal active:text-black',
            )}
            aria-label="Next slide"
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
          </button>
        </div>
      </div>

      <div className={clsx('slide-list__content flex gap-8', containerClassName)}>
        {featuredSlot && (
          <div className="slide-list__featured w-[600px] flex-shrink-0">
            {featuredSlot}
          </div>
        )}

        <div
          className="slide-list__container relative overflow-hidden flex-shrink-0"
          style={{ width: slidesWrapperWidth }}
        >
          <div
            className="slide-list__track flex transition-transform duration-300 ease-in-out pb-8"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {Array.from({ length: totalSlides }, (_, index) => (
              <div
                key={`slide-${index}`}
                className={clsx('slide-list__track-item w-full flex-shrink-0 flex gap-8', slideClassName)}
              >
                {childrenArray
                  .slice(index * itemsPerSlide, (index + 1) * itemsPerSlide)
                  .map((child, i) => (
                    <div
                      key={`item-${index}-${i}`}
                      className="slide-list__item flex-1"
                    >
                      {child}
                    </div>
                  ))}
              </div>
            ))}
          </div>

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
