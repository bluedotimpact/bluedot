import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import Link from 'next/link';
import { H2, P } from '@bluedot/ui';
import clsx from 'clsx';

export type TestimonialMember = {
  name: string;
  jobTitle: string;
  quote: string;
  imageSrc: string;
  url?: string;
};

export type TestimonialCarouselProps = {
  testimonials: TestimonialMember[];
  title?: string;
  subtitle?: string;
  variant?: 'homepage' | 'lander';
  /** When true, suppress the quote text on every card and show image + name + role only. */
  hideQuotes?: boolean;
};

/**
 * Minimum testimonial count before triplicating the list to enable infinite-loop
 * scrolling.
 * Depends on viewport because a handful of cards that already fill a mobile
 * viewport might not fill a desktop one (and vice versa). Below the returned
 * threshold we render cards once, left-aligned, with no nav buttons.
 */
const getMinForInfinite = (viewportWidth: number): number => {
  if (viewportWidth >= 1280) return 4;
  if (viewportWidth >= 680) return 3;
  return 2;
};

const TestimonialCarousel = ({
  testimonials,
  title,
  subtitle,
  variant = 'homepage',
  hideQuotes = false,
}: TestimonialCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isResettingRef = useRef(false);

  // SSR/first render assumes desktop; updated on mount + resize via the effect below.
  const [shouldLoop, setShouldLoop] = useState(() => testimonials.length >= getMinForInfinite(1280));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const update = () => {
      setShouldLoop(testimonials.length >= getMinForInfinite(window.innerWidth));
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [testimonials.length]);

  const createInfiniteScrollData = () => {
    if (testimonials.length === 0) {
      return [];
    }

    return shouldLoop
      ? [...testimonials, ...testimonials, ...testimonials]
      : testimonials;
  };

  const infiniteTestimonials = createInfiniteScrollData();

  const getCardWidth = useCallback(() => {
    if (typeof window === 'undefined') {
      return 320;
    }

    const width = window.innerWidth;
    if (width >= 1280) {
      return 320;
    }

    if (width >= 680) {
      return 288;
    }

    return 276;
  }, []);

  const getCardGap = useCallback(() => {
    if (typeof window === 'undefined') {
      return 32;
    }

    const width = window.innerWidth;
    if (width >= 1024) {
      return 32;
    }

    if (width >= 680) {
      return 24;
    }

    return 20;
  }, []);

  // Auto-scroll removed: distracting. Manual nav buttons + arrow keys still work.

  useEffect(() => {
    if (scrollContainerRef.current && testimonials.length > 0 && shouldLoop) {
      const cardWidth = getCardWidth();
      const gap = getCardGap();
      const scrollUnit = cardWidth + gap;
      const sectionWidth = testimonials.length * scrollUnit;
      scrollContainerRef.current.scrollLeft = sectionWidth;
    }
  }, [testimonials.length, getCardWidth, getCardGap, shouldLoop]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container && !isResettingRef.current && testimonials.length > 0 && shouldLoop) {
      const { scrollLeft } = container;
      const cardWidth = getCardWidth();
      const gap = getCardGap();
      const scrollUnit = cardWidth + gap;
      const sectionWidth = testimonials.length * scrollUnit;

      if (scrollLeft >= sectionWidth * 2) {
        isResettingRef.current = true;
        container.scrollLeft = scrollLeft - sectionWidth;
        isResettingRef.current = false;
      } else if (scrollLeft < sectionWidth) {
        isResettingRef.current = true;
        container.scrollLeft = scrollLeft + sectionWidth;
        isResettingRef.current = false;
      }
    }
  }, [testimonials.length, getCardWidth, getCardGap, shouldLoop]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const cardWidth = getCardWidth();
      const gap = getCardGap();
      const scrollAmount = cardWidth + gap;
      const newScrollLeft = scrollContainerRef.current.scrollLeft
        + (direction === 'right' ? scrollAmount : -scrollAmount);

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  }, [getCardWidth, getCardGap]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scroll('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scroll('right');
    }
  }, [scroll]);

  const defaultTitle = variant === 'homepage'
    ? 'Our community'
    : 'Meet our alumni shaping AI\'s future';

  const headerSizeClasses = variant === 'homepage'
    ? 'text-[28px] min-[680px]:text-[36px] min-[1024px]:text-[40px] min-[1280px]:text-[48px]'
    : 'text-[28px] min-[680px]:text-[32px] xl:text-[36px]';

  return (
    <section className="w-full bg-white py-12 md:py-16 lg:py-20 xl:py-24 px-5 min-[680px]:px-8 lg:px-12 xl:px-16 2xl:px-20">
      {/* Header Container */}
      <div className="mx-auto max-w-screen-xl mb-8 min-[680px]:mb-16 min-[1024px]:mb-20 min-[1440px]:mb-16">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center min-[680px]:flex-row min-[680px]:items-end min-[680px]:justify-between min-[680px]:text-left gap-8 min-[680px]:gap-16">
          {/* Header Content */}
          <div className="flex flex-col gap-8">
            {variant === 'homepage' ? (
              <h2
                className={clsx(
                  headerSizeClasses,
                  'font-medium leading-[125%] text-bluedot-navy tracking-[-1px]',
                )}
                style={{ fontFeatureSettings: '\'ss04\' on' }}
              >
                {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
                {title || defaultTitle}
              </h2>
            ) : (
              <H2 className={clsx(headerSizeClasses, 'font-semibold leading-[125%] text-bluedot-navy tracking-[-0.01em]')}>
                {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
                {title || defaultTitle}
              </H2>
            )}
            {subtitle && (
              <P className="text-[16px] min-[680px]:text-[18px] font-normal leading-[160%] text-bluedot-navy/80 max-w-full">
                {subtitle}
              </P>
            )}
          </div>

          {/* Navigation Buttons - Desktop (carousel only) */}
          {shouldLoop && (
            <div className="hidden min-[680px]:flex gap-3 flex-shrink-0">
              <NavigationButton
                direction="left"
                onClick={() => scroll('left')}
                disabled={false}
              />
              <NavigationButton
                direction="right"
                onClick={() => scroll('right')}
                disabled={false}
              />
            </div>
          )}
        </div>
      </div>

      {shouldLoop ? (
        /* Scrolling carousel: bleeds to viewport edges, auto-advances, loops */
        <div className="relative -mx-5 min-[680px]:-mx-8 lg:-mx-12 xl:-mx-16 2xl:-mx-20">
          <div id="community-carousel-description" className="sr-only">
            This carousel uses infinite scrolling and auto-advances every few seconds. Hover to pause auto-scrolling. Use arrow keys to navigate when focused. Navigation buttons allow manual control.
          </div>

          <div
            ref={scrollContainerRef}
            className="grid grid-flow-col auto-rows-fr overflow-x-auto scrollbar-none px-5 min-[680px]:px-8 lg:px-12 xl:pl-[max(64px,calc(50vw-640px))] xl:pr-16 2xl:pl-[max(80px,calc(50vw-640px))] 2xl:pr-20 gap-[20px] min-[680px]:gap-[24px] min-[1280px]:gap-[32px]"
            style={{
              scrollSnapType: 'none',
              scrollBehavior: 'auto',
            }}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}

            tabIndex={0}
            role="region"
            aria-label="Testimonials carousel"
            aria-describedby="community-carousel-description"
          >
            {infiniteTestimonials.map((testimonial, index) => {
              const sectionNumber = Math.floor(index / testimonials.length);
              const uniqueKey = `${testimonial.name}-${index}-${sectionNumber}`;
              return (
                <div key={uniqueKey} className="h-full">
                  <TestimonialMemberCard testimonial={testimonial} hideQuote={hideQuotes} />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Too few to fill the viewport: render once, left-aligned, equal heights. */
        <div className="mx-auto max-w-screen-xl">
          <div className="grid auto-rows-fr gap-[20px] min-[680px]:gap-[24px] min-[1280px]:gap-[32px] grid-cols-[repeat(auto-fit,276px)] min-[680px]:grid-cols-[repeat(auto-fit,288px)] min-[1280px]:grid-cols-[repeat(auto-fit,320px)]">
            {testimonials.map((testimonial, index) => (
              <div key={`${testimonial.name}-${index}`} className="h-full">
                <TestimonialMemberCard testimonial={testimonial} hideQuote={hideQuotes} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Navigation Buttons (carousel only) */}
      {shouldLoop && (
        <div className="flex min-[680px]:hidden gap-3 justify-center mt-8">
          <NavigationButton
            direction="left"
            onClick={() => scroll('left')}
            disabled={false}
          />
          <NavigationButton
            direction="right"
            onClick={() => scroll('right')}
            disabled={false}
          />
        </div>
      )}
    </section>
  );
};

const TestimonialMemberCard = ({ testimonial, hideQuote = false }: { testimonial: TestimonialMember; hideQuote?: boolean }) => {
  const hasQuote = !hideQuote && testimonial.quote?.trim();

  const cardContent = (
    <>
      {/* Image Section */}
      <div className="flex-shrink-0 w-full h-[296px] min-[680px]:h-[320px]">
        <img
          src={testimonial.imageSrc}
          alt={`Profile of ${testimonial.name}`}
          className="size-full object-cover"
        />
      </div>

      {/* Content Section - flex-1 to fill available space */}
      <div className="flex flex-1 flex-col p-6">
        {/* Inner flex container with gap-8 (32px) matching Figma */}
        <div className="flex flex-1 flex-col gap-8">
          {/* Quote uses flex-1 to grow and push name to bottom */}
          {hasQuote ? (
            <P className="flex-1 text-[16px] font-normal leading-[160%] text-bluedot-navy text-left w-full">
              {testimonial.quote}
            </P>
          ) : (
            /* Spacer when no quote - pushes name/jobTitle to bottom */
            <div className="flex-1" />
          )}

          {/* Name and Job Title Container - shrink-0 stays at bottom */}
          <div className="flex flex-col items-start gap-1 shrink-0 w-full">
            {/* Name */}
            <P className="text-[16px] font-semibold leading-[125%] text-bluedot-navy text-left w-full">
              {testimonial.name}
            </P>

            {/* Job Title */}
            <P className="text-[14px] font-normal leading-[160%] text-bluedot-navy/60 text-left w-full">
              {testimonial.jobTitle}
            </P>
          </div>
        </div>
      </div>
    </>
  );

  const cardClasses = 'flex flex-col flex-shrink-0 h-full bg-white border border-bluedot-navy/10 rounded-xl overflow-hidden w-[276px] min-[680px]:w-[288px] min-[1280px]:w-[320px]';

  if (testimonial.url) {
    return (
      <Link
        href={testimonial.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cardClasses} cursor-pointer`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={cardClasses}>
      {cardContent}
    </div>
  );
};

const NavigationButton = ({
  direction,
  onClick,
  disabled,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      'size-[44px] rounded-full flex items-center justify-center',
      'bg-bluedot-navy/8',
      'transition-all duration-200',
      disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'opacity-80 hover:opacity-100 hover:bg-bluedot-navy/15 cursor-pointer',
    )}
    aria-label={`Scroll ${direction}`}
  >
    <span
      className="text-bluedot-navy text-[22.4px] font-medium select-none"
      style={{
        transform: direction === 'left' ? 'scaleX(-1)' : 'none',
      }}
    >
      →
    </span>
  </button>
);

export default TestimonialCarousel;
