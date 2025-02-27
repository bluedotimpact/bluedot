import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import clsx from 'clsx';
import { type SectionHeadingProps, SectionHeading } from './Section';

export type SlideListProps = {
  className?: string;
  children: React.ReactNode;
  featuredSlot?: React.ReactNode;
  maxItemsPerSlide?: number;
  minItemWidth?: number;
} & SectionHeadingProps;

export const SlideList: React.FC<SlideListProps> = ({
  className,
  children,
  featuredSlot,
  maxItemsPerSlide = 1,
  minItemWidth = 260,
  title,
  titleLevel,
  subtitle,
  subtitleLevel,
}) => {
  const slidesRef = useRef<HTMLDivElement | null>(null);
  const [measuredContainerWidth, setMeasuredContainerWidth] = useState<number | null>(null);
  const [scrollPercent, setScrollPercent] = useState(0);

  // Use a ResizeObserver to set the number of slides based on the width of the container
  useEffect(() => {
    const cleanup = () => {
      if (slidesRef.current) {
        resizeObserver.unobserve(slidesRef.current);
      }
    };

    if (!slidesRef.current) return cleanup;

    if (measuredContainerWidth === null && slidesRef.current) {
      setMeasuredContainerWidth(slidesRef.current.getBoundingClientRect().width);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setMeasuredContainerWidth(entry.contentRect.width);
      });
    });
    resizeObserver.observe(slidesRef.current);

    return cleanup;
  }, []);

  const itemsFit = Math.max(1, Math.floor((measuredContainerWidth ?? 800) / minItemWidth));
  const itemsPerSlide = Math.max(1, Math.min(itemsFit, maxItemsPerSlide));

  // Handle scroll events -> update progress bar
  useEffect(() => {
    function handleScroll() {
      const container = slidesRef.current;
      if (!container) return;

      const { scrollLeft, scrollWidth, clientWidth } = container;
      const maxScrollLeft = scrollWidth - clientWidth;
      if (maxScrollLeft <= 0) {
        setScrollPercent(0);
        return;
      }
      const percent = (scrollLeft / maxScrollLeft) * 100;
      setScrollPercent(percent);
    }

    const cleanup = () => {
      container?.removeEventListener('scroll', handleScroll);
    };

    const container = slidesRef.current;
    if (!container) return cleanup;

    container.addEventListener('scroll', handleScroll);
    return cleanup;
  }, []);

  const scrollTo = useCallback((direction: 'next' | 'previous') => {
    const container = slidesRef.current;
    if (!container) return;

    const { scrollLeft } = container;
    const childArray = Array.from(container.children) as HTMLDivElement[];

    // Jump forward/back by itemsPerSlide
    const tolerancePx = 5;
    const currentIndex = childArray.findIndex((c) => c.offsetLeft >= scrollLeft - tolerancePx);
    const targetIndex = direction === 'next'
      ? Math.min(currentIndex + itemsPerSlide, childArray.length - 1)
      : Math.max(currentIndex - itemsPerSlide, 0);

    const targetChild = childArray[targetIndex];

    if (targetChild) {
      container.scrollTo({ left: targetChild.offsetLeft, behavior: 'smooth' });
    }
  }, [itemsPerSlide]);

  const childrenArray = React.Children.toArray(children) as React.ReactElement[];
  const allChildrenFit = childrenArray.length <= itemsPerSlide;

  // If there are multiple slides, show 15% of the next card to signal that the section is scrollable
  const peekAdjustment = allChildrenFit ? '1' : `(1 - ${0.15 / itemsPerSlide})`;
  const itemWidth = `calc((${100 / itemsPerSlide}% - var(--space-between) * ${(itemsPerSlide - 1) / itemsPerSlide}) * ${peekAdjustment})`;
  // Threshold for scrolling to the next item when tabbing through the list, only needs to be approximate
  const scrollPaddingPx = `${(measuredContainerWidth ?? minItemWidth * itemsPerSlide) * 0.15}px`;

  const PrevButton = (
    <SlideListBtn
      onClick={() => scrollTo('previous')}
      disabled={scrollPercent === 0}
      ariaLabel="Previous slide"
      direction="previous"
    />
  );
  const NextButton = (
    <SlideListBtn
      onClick={() => scrollTo('next')}
      disabled={scrollPercent === 100}
      ariaLabel="Next slide"
      direction="next"
    />
  );

  const scrollBarWidth = `${100 * (itemsPerSlide / childrenArray.length)}%`;
  const scrollBarLeft = `calc((100% - ${scrollBarWidth}) * ${scrollPercent / 100})`;

  const ScrollBar = (
    <div className="slide-list__progress w-full relative h-1 mb-1">
      <div className="slide-list__progress-track absolute h-px top-px w-full bg-color-divider" />
      <div
        className="slide-list__progress-track absolute h-full bg-bluedot-normal"
        style={{
          width: scrollBarWidth,
          left: scrollBarLeft,
        }}
      />
    </div>
  );

  return (
    <div
      className={clsx(
        'slide-list w-full flex flex-col',
        className,
      )}
    >
      <SectionHeading
        title={title}
        titleLevel={titleLevel}
        subtitle={subtitle}
        subtitleLevel={subtitleLevel}
        rightNode={
          !allChildrenFit && (
            <div
              className={clsx(
                'slide-list__nav--header items-center gap-2 ml-auto mt-auto',
                // Hide if there is a featuredSlot directly underneath
                featuredSlot ? 'hidden lg:flex' : 'flex',
              )}
            >
              {PrevButton}
              {NextButton}
            </div>
          )
        }
      />
      <div className="slide-list__content flex flex-col lg:flex-row gap-space-between items-stretch">
        {featuredSlot}

        <div className="slide-list__container relative overflow-hidden flex-1 flex flex-col gap-space-between">
          {!allChildrenFit && (
            <div
              className={clsx(
                'slide-list__nav--container items-center justify-end gap-2',
                featuredSlot ? 'lg:hidden flex' : 'hidden',
              )}
            >
              {PrevButton}
              {NextButton}
            </div>
          )}
          {!allChildrenFit && (
            <div className="slide-list__gradient-overlay absolute inset-0 pointer-events-none z-10 flex">
              {scrollPercent > 1 && (
                <div className="slide-list__gradient-left absolute inset-y-0 left-0 w-8 bg-linear-to-r from-cream-normal to-transparent opacity-50" />
              )}
              {scrollPercent < 99 && (
                <div className="slide-list__gradient-right absolute inset-y-0 right-0 w-8 bg-linear-to-l from-cream-normal to-transparent opacity-50" />
              )}
            </div>
          )}

          <div
            ref={slidesRef}
            className="slide-list__slides flex overflow-x-scroll scrollbar-hidden transition-transform duration-300 gap-space-between snap-x snap-mandatory"
            style={{ scrollPaddingInline: scrollPaddingPx }}
          >
            {React.Children.map(children, (child) => (
              <div
                className="slide-list__slide shrink-0 snap-start"
                style={{
                  width: itemWidth,
                  scrollMarginLeft: `-${scrollPaddingPx}`,
                }}
              >
                {child}
              </div>
            ))}
          </div>

          {!allChildrenFit && itemsPerSlide > 1 && ScrollBar}
        </div>
      </div>
    </div>
  );
};

export const SlideListBtn: React.FC<{
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
  direction: 'previous' | 'next';
}> = ({
  onClick, disabled, ariaLabel, direction,
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
      'focus:outline-hidden focus:ring-2 focus:ring-bluedot-light',
    )}
    aria-label={ariaLabel}
  >
    {direction === 'previous' ? (
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
    ) : (
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
    )}
  </button>
);
