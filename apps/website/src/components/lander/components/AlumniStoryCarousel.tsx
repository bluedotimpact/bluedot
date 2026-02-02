import {
  useRef,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import Link from 'next/link';
import { H2, P } from '@bluedot/ui';
import clsx from 'clsx';

export type AlumniStory = {
  name: string;
  role: string;
  story: ReactNode;
  imageSrc: string;
  url?: string;
};

export type AlumniStoryCarouselProps = {
  stories: AlumniStory[];
  title?: string;
  subtitle?: string;
};

const CARD_CONFIG = {
  AUTO_SCROLL_INTERVAL: 5000,
} as const;

const AlumniStoryCarousel = ({
  stories,
  title = 'People who took this path',
  subtitle,
}: AlumniStoryCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isResettingRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);

  const createInfiniteScrollData = () => {
    if (stories.length === 0) return [];
    return [...stories, ...stories, ...stories];
  };

  const infiniteStories = createInfiniteScrollData();

  const getCardWidth = useCallback(() => {
    if (typeof window === 'undefined') return 400;
    const width = window.innerWidth;
    if (width >= 1280) return 420;
    if (width >= 680) return 380;
    return 320;
  }, []);

  const getCardGap = useCallback(() => {
    if (typeof window === 'undefined') return 24;
    const width = window.innerWidth;
    if (width >= 1024) return 32;
    if (width >= 680) return 24;
    return 20;
  }, []);

  const startAutoScroll = useCallback(() => {
    if (prefersReducedMotionRef.current) return;
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
    if (typeof window === 'undefined') return undefined;
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
    if (scrollContainerRef.current && stories.length > 0) {
      const cardWidth = getCardWidth();
      const gap = getCardGap();
      const scrollUnit = cardWidth + gap;
      const sectionWidth = stories.length * scrollUnit;
      scrollContainerRef.current.scrollLeft = sectionWidth;
    }
  }, [stories.length, getCardWidth, getCardGap]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container && !isResettingRef.current && stories.length > 0) {
      const { scrollLeft } = container;
      const cardWidth = getCardWidth();
      const gap = getCardGap();
      const scrollUnit = cardWidth + gap;
      const sectionWidth = stories.length * scrollUnit;

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
  }, [stories.length, getCardWidth, getCardGap]);

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

  return (
    <section className="w-full bg-white py-12 md:py-16 lg:py-20 xl:py-24 px-5 min-[680px]:px-8 lg:px-12 xl:px-16 2xl:px-20">
      {/* Header Container */}
      <div className="mx-auto max-w-screen-xl mb-8 min-[680px]:mb-12 min-[1024px]:mb-16">
        <div className="flex flex-col items-center text-center min-[680px]:flex-row min-[680px]:items-end min-[680px]:justify-between min-[680px]:text-left gap-6 min-[680px]:gap-16">
          <div className="flex flex-col gap-4">
            <H2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-[#13132E] tracking-[-0.01em]">
              {title}
            </H2>
            {subtitle && (
              <P className="text-[16px] min-[680px]:text-[18px] font-normal leading-[160%] text-[#13132E] opacity-60 italic">
                {subtitle}
              </P>
            )}
          </div>

          {/* Navigation Buttons - Desktop */}
          <div className="hidden min-[680px]:flex gap-3 flex-shrink-0">
            <NavigationButton
              direction="left"
              onClick={() => scroll('left')}
            />
            <NavigationButton
              direction="right"
              onClick={() => scroll('right')}
            />
          </div>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative -mx-5 min-[680px]:-mx-8 lg:-mx-12 xl:-mx-16 2xl:-mx-20">
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          ref={scrollContainerRef}
          className="flex flex-nowrap overflow-x-auto scrollbar-none px-5 min-[680px]:px-8 lg:px-12 xl:pl-[max(64px,calc(50vw-640px))] xl:pr-16 2xl:pl-[max(80px,calc(50vw-640px))] 2xl:pr-20 gap-[20px] min-[680px]:gap-[24px] min-[1280px]:gap-[32px]"
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
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          role="region"
          aria-label="Alumni stories carousel"
        >
          {infiniteStories.map((story, index) => {
            const sectionNumber = Math.floor(index / stories.length);
            const uniqueKey = `${story.name}-${index}-${sectionNumber}`;
            return (
              <div key={uniqueKey}>
                <AlumniStoryCard story={story} />
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
        />
        <NavigationButton
          direction="right"
          onClick={() => scroll('right')}
        />
      </div>
    </section>
  );
};

const cardClassName = 'flex flex-col flex-shrink-0 bg-white border border-[rgba(19,19,46,0.1)] rounded-2xl overflow-hidden w-[320px] min-[680px]:w-[380px] min-[1280px]:w-[420px] hover:border-[rgba(19,19,46,0.2)] hover:shadow-lg transition-all duration-200';

const AlumniStoryCardContent = ({ story }: { story: AlumniStory }) => (
  <>
    {/* Top section with image and info */}
    <div className="flex items-start gap-4 p-5 min-[680px]:p-6 border-b border-[rgba(19,19,46,0.06)]">
      <img
        src={story.imageSrc}
        alt={story.name}
        className="size-16 min-[680px]:size-20 rounded-full object-cover flex-shrink-0"
      />
      <div className="flex flex-col gap-1 min-w-0 pt-1">
        <P className="text-[17px] min-[680px]:text-[18px] font-semibold leading-[130%] text-[#13132E] truncate">
          {story.name}
        </P>
        <P className="text-[14px] min-[680px]:text-[15px] leading-[150%] text-[#13132E]/70">
          {story.role}
        </P>
      </div>
    </div>

    {/* Story content */}
    <div className="p-5 min-[680px]:p-6 flex-grow">
      <P className="text-[15px] min-[680px]:text-[16px] leading-[1.7] text-[#13132E]/80">
        {story.story}
      </P>
    </div>
  </>
);

const AlumniStoryCard = ({ story }: { story: AlumniStory }) => {
  if (story.url) {
    return (
      <Link
        href={story.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClassName}
      >
        <AlumniStoryCardContent story={story} />
      </Link>
    );
  }

  return (
    <div className={cardClassName}>
      <AlumniStoryCardContent story={story} />
    </div>
  );
};

const NavigationButton = ({
  direction,
  onClick,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      'size-[44px] rounded-full flex items-center justify-center',
      'bg-[rgba(19,19,46,0.08)]',
      'transition-all duration-200',
      'opacity-80 hover:opacity-100 hover:bg-[rgba(19,19,46,0.15)] cursor-pointer',
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

export default AlumniStoryCarousel;
