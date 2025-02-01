import React, { useState } from 'react';
import clsx from 'clsx';

export type SlideListProps = {
  className?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  featuredSlot?: React.ReactNode;
  itemsPerSlide?: number;
};

export const SlideList: React.FC<SlideListProps> = ({
  className,
  title,
  description,
  children,
  featuredSlot,
  itemsPerSlide = 1,
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
        <div className="slide-list__titles">
          <h2 className="slide-list__title text-4xl font-bold text-navy-900">{title}</h2>
          {description && (
            <p className="slide-list__description mt-4 text-lg text-gray-700">{description}</p>
          )}
        </div>
        <div className="slide-list__navigation flex gap-2">
          <button
            type="button"
            onClick={handlePrevious}
            className="slide-list__button slide-list__button--prev p-3 border rounded-lg hover:bg-gray-50"
            aria-label="Previous slide"
          >
            <svg
              className="size-5"
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
            className="slide-list__button slide-list__button--next p-3 border rounded-lg hover:bg-gray-50"
            aria-label="Next slide"
          >
            <svg
              className="size-5"
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

      <div className="slide-list__container flex gap-8">
        {featuredSlot && (
          <div className="slide-list__featured w-[600px] flex-shrink-0">
            {featuredSlot}
          </div>
        )}

        <div className="slide-list__slides relative overflow-hidden flex-shrink-0" style={{ width: '800px' }}>
          <div
            className="slide-list__slides-wrapper flex transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
            }}
          >
            {Array.from({ length: totalSlides }, (_, index) => (
              <div key={index} className="slide-list__slide w-full flex-shrink-0 flex gap-8">
                {childrenArray
                  .slice(index * itemsPerSlide, (index + 1) * itemsPerSlide)
                  .map((child, childIndex) => (
                    <div key={childIndex} className="slide-list__slide-item flex-1">
                      {child}
                    </div>
                  ))}
              </div>
            ))}
          </div>

          <div className="slide-list__progress absolute bottom-0 left-0 w-full h-1 bg-gray-100">
            <div
              className="slide-list__progress-bar h-full bg-bluedot-normal transition-all duration-300"
              style={{
                width: `${((currentSlide + 1) / totalSlides) * 100}%`,
              }}
            />
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
