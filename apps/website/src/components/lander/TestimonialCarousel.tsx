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
    ? 'text-size-xl bd-md:text-size-2xl'
    : 'text-size-xl';

  return (
    <section className="w-full bg-white py-12 md:py-16 lg:py-20 xl:py-24 px-5 bd-md:px-8 lg:px-12 xl:px-16 2xl:px-20">
      {/* Header Container */}
      <div className="mx-auto max-w-screen-xl mb-8 bd-md:mb-16 min-[1024px]:mb-20 min-[1440px]:mb-16">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center bd-md:flex-row bd-md:items-end bd-md:justify-between bd-md:text-left gap-8 bd-md:gap-16">
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
              <P className="text-size-sm bd-md:text-size-md font-normal leading-[160%] text-bluedot-navy/80 max-w-full">
                {subtitle}
              </P>
            )}
          </div>

          {/* Navigation Buttons - Desktop (carousel only) */}
          {shouldLoop && (
            <div className="hidden bd-md:flex gap-3 flex-shrink-0">
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
        <div className="relative -mx-5 bd-md:-mx-8 lg:-mx-12 xl:-mx-16 2xl:-mx-20">
          <div id="community-carousel-description" className="sr-only">
            This carousel uses infinite scrolling and auto-advances every few seconds. Hover to pause auto-scrolling. Use arrow keys to navigate when focused. Navigation buttons allow manual control.
          </div>

          <div
            ref={scrollContainerRef}
            className="grid grid-flow-col auto-rows-fr overflow-x-auto scrollbar-none px-5 bd-md:px-8 lg:px-12 xl:pl-[max(64px,calc(50vw-640px))] xl:pr-16 2xl:pl-[max(80px,calc(50vw-640px))] 2xl:pr-20 gap-[20px] bd-md:gap-[24px] xl:gap-[32px]"
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
          <div className="grid auto-rows-fr gap-[20px] bd-md:gap-[24px] xl:gap-[32px] grid-cols-[repeat(auto-fit,276px)] bd-md:grid-cols-[repeat(auto-fit,288px)] xl:grid-cols-[repeat(auto-fit,320px)]">
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
        <div className="flex bd-md:hidden gap-3 justify-center mt-8">
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

  const imageBlock = (
    <div className="flex-shrink-0 w-full h-[296px] bd-md:h-[320px]">
      <img
        src={testimonial.imageSrc}
        alt={`Profile of ${testimonial.name}`}
        className="size-full object-cover"
      />
    </div>
  );

  const nameRoleBlock = (
    <div className="flex flex-col items-start gap-1 w-full">
      <P className="text-size-sm font-semibold leading-[125%] text-bluedot-navy text-left w-full">
        {testimonial.name}
      </P>
      <P className="text-size-xs font-normal leading-[160%] text-bluedot-navy/60 text-left w-full">
        {testimonial.jobTitle}
      </P>
    </div>
  );

  const cardContent = hideQuote ? (
    /* Alumni-wall layout: image flush at top, tight name/role block right below.
       No spacer, no quote, no flex-1 fill — card sizes to its natural content. */
    <>
      {imageBlock}
      <div className="px-6 py-5">
        {nameRoleBlock}
      </div>
    </>
  ) : (
    /* Default layout: image, then quote (or spacer) that fills available height,
       pushing name/role to the bottom of the card so all cards align. */
    <>
      {imageBlock}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-1 flex-col gap-8">
          {hasQuote ? (
            <P className="flex-1 text-size-sm font-normal leading-[160%] text-bluedot-navy text-left w-full">
              {testimonial.quote}
            </P>
          ) : (
            <div className="flex-1" />
          )}
          {nameRoleBlock}
        </div>
      </div>
    </>
  );

  const cardClasses = 'flex flex-col flex-shrink-0 h-full bg-white border border-bluedot-navy/10 rounded-xl overflow-hidden w-[276px] bd-md:w-[288px] xl:w-[320px]';

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
      className="text-bluedot-navy text-size-lg font-medium select-none"
      style={{
        transform: direction === 'left' ? 'scaleX(-1)' : 'none',
      }}
    >
      →
    </span>
  </button>
);

export default TestimonialCarousel;
