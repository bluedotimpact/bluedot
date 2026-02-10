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
};

const CARD_CONFIG = {
  AUTO_SCROLL_INTERVAL: 3000,
} as const;

const TestimonialCarousel = ({
  testimonials,
  title,
  subtitle,
  variant = 'homepage',
}: TestimonialCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isResettingRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);

  const createInfiniteScrollData = () => {
    if (testimonials.length === 0) {
      return [];
    }

    return [...testimonials, ...testimonials, ...testimonials];
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

  const startAutoScroll = useCallback(() => {
    if (prefersReducedMotionRef.current) {
      return;
    }

    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }

    autoScrollIntervalRef.current = setInterval(() => {
      if (scrollContainerRef.current && !isResettingRef.current) {
        const cardWidth = getCardWidth();
        const gap = getCardGap();
        const scrollAmount = cardWidth + gap;
        const currentScrollLeft = scrollContainerRef.current.scrollLeft;
        const newScrollLeft = currentScrollLeft + scrollAmount;

        scrollContainerRef.current.scrollTo({
          left: newScrollLeft,
          behavior: 'smooth',
        });
      }
    }, CARD_CONFIG.AUTO_SCROLL_INTERVAL);
  }, [getCardWidth, getCardGap]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isHovered && !prefersReducedMotionRef.current) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }

    return () => {
      stopAutoScroll();
    };
  }, [isHovered, startAutoScroll, stopAutoScroll]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyPreference = (matches: boolean) => {
      prefersReducedMotionRef.current = matches;
      if (matches) {
        stopAutoScroll();
      } else if (!isHovered) {
        startAutoScroll();
      }
    };

    applyPreference(mql.matches);

    const onChange = (e: MediaQueryListEvent) => {
      applyPreference(e.matches);
    };

    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [isHovered, startAutoScroll, stopAutoScroll]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleFocus = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsHovered(false);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current && testimonials.length > 0) {
      const cardWidth = getCardWidth();
      const gap = getCardGap();
      const scrollUnit = cardWidth + gap;
      const sectionWidth = testimonials.length * scrollUnit;
      scrollContainerRef.current.scrollLeft = sectionWidth;
    }
  }, [testimonials.length, getCardWidth, getCardGap]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container && !isResettingRef.current && testimonials.length > 0) {
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
  }, [testimonials.length, getCardWidth, getCardGap]);

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
                  'font-medium leading-[125%] text-[#13132E] tracking-[-1px]',
                )}
                style={{ fontFeatureSettings: '\'ss04\' on' }}
              >
                {title || defaultTitle}
              </h2>
            ) : (
              <H2 className={clsx(headerSizeClasses, 'font-semibold leading-[125%] text-[#13132E] tracking-[-0.01em]')}>
                {title || defaultTitle}
              </H2>
            )}
            {subtitle && (
              <P className="text-[16px] min-[680px]:text-[18px] font-normal leading-[160%] text-[#13132E] opacity-80 max-w-full">
                {subtitle}
              </P>
            )}
          </div>

          {/* Navigation Buttons - Desktop */}
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
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative -mx-5 min-[680px]:-mx-8 lg:-mx-12 xl:-mx-16 2xl:-mx-20">
        <div id="community-carousel-description" className="sr-only">
          This carousel uses infinite scrolling and auto-advances every few seconds. Hover to pause auto-scrolling. Use arrow keys to navigate when focused. Navigation buttons allow manual control.
        </div>

        { }
        <div
          ref={scrollContainerRef}
          className="grid grid-flow-col auto-rows-fr overflow-x-auto scrollbar-none px-5 min-[680px]:px-8 lg:px-12 xl:pl-[max(64px,calc(50vw-640px))] xl:pr-16 2xl:pl-[max(80px,calc(50vw-640px))] 2xl:pr-20 gap-[20px] min-[680px]:gap-[24px] min-[1280px]:gap-[32px]"
          style={{
            scrollSnapType: 'none',
            scrollBehavior: 'auto',
          }}
          onScroll={handleScroll}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
                <TestimonialMemberCard testimonial={testimonial} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Navigation Buttons */}
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
    </section>
  );
};

const TestimonialMemberCard = ({ testimonial }: { testimonial: TestimonialMember }) => {
  const hasQuote = testimonial.quote?.trim();

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
            <P className="flex-1 text-[16px] font-normal leading-[160%] text-[#13132E] text-left w-full">
              {testimonial.quote}
            </P>
          ) : (
            /* Spacer when no quote - pushes name/jobTitle to bottom */
            <div className="flex-1" />
          )}

          {/* Name and Job Title Container - shrink-0 stays at bottom */}
          <div className="flex flex-col items-start gap-1 shrink-0 w-full">
            {/* Name */}
            <P className="text-[16px] font-semibold leading-[125%] text-[#13132E] text-left w-full">
              {testimonial.name}
            </P>

            {/* Job Title */}
            <P className="text-[14px] font-normal leading-[160%] text-[#13132E] text-left w-full opacity-60">
              {testimonial.jobTitle}
            </P>
          </div>
        </div>
      </div>
    </>
  );

  const cardClasses = 'flex flex-col flex-shrink-0 h-full bg-white border border-[rgba(19,19,46,0.1)] rounded-xl overflow-hidden w-[276px] min-[680px]:w-[288px] min-[1280px]:w-[320px]';

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
      'bg-[rgba(19,19,46,0.08)]',
      'transition-all duration-200',
      disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'opacity-80 hover:opacity-100 hover:bg-[rgba(19,19,46,0.15)] cursor-pointer',
    )}
    aria-label={`Scroll ${direction}`}
  >
    <span
      className="text-[#13132E] text-[22.4px] font-medium select-none"
      style={{
        transform: direction === 'left' ? 'scaleX(-1)' : 'none',
      }}
    >
      →
    </span>
  </button>
);

export default TestimonialCarousel;
