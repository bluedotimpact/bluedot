import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { CTALinkOrButton, ProgressDots } from '@bluedot/ui';
import { buildTimeDeltaString } from '../events/eventsUtils';
import { trpc } from '../../utils/trpc';
import { ROUTES } from '../../lib/routes';
import type { Event } from '../../server/routers/luma';

type Photo = {
  id: string;
  src: string;
  alt: string;
  width: number;
};

const BLUEDOT_EVENTS_PHOTOS: Photo[] = [
  {
    id: '1', src: '/images/homepage/events-1.webp', alt: 'BlueDot event', width: 512,
  },
  {
    id: '2', src: '/images/homepage/events-2.webp', alt: 'BlueDot event', width: 647,
  },
  {
    id: '3', src: '/images/homepage/events-3.webp', alt: 'BlueDot event', width: 512,
  },
  {
    id: '4', src: '/images/homepage/events-4.webp', alt: 'BlueDot event', width: 499,
  },
  {
    id: '5', src: '/images/homepage/events-5.webp', alt: 'BlueDot event', width: 325,
  },
  {
    id: '6', src: '/images/homepage/events-6.webp', alt: 'BlueDot event', width: 512,
  },
  {
    id: '7', src: '/images/homepage/events-7.webp', alt: 'BlueDot event', width: 433,
  },
  {
    id: '8', src: '/images/homepage/events-8.webp', alt: 'BlueDot event', width: 325,
  },
  {
    id: '9', src: '/images/homepage/events-9.webp', alt: 'BlueDot event', width: 637,
  },
  {
    id: '10', src: '/images/homepage/events-10.webp', alt: 'BlueDot event', width: 637,
  },
  {
    id: '11', src: '/images/homepage/events-11.webp', alt: 'BlueDot event', width: 500,
  },
];

const CAROUSEL_CONFIG = {
  AUTO_SCROLL_INTERVAL: 50, // 50ms intervals for smooth continuous scrolling
  SCROLL_SPEED: 0.75, // pixels per interval (0.75px * 20 intervals/sec = 15px/sec)
} as const;

const EVENTS_SECTION_URL = `${ROUTES.events.url}?utm_source=website&utm_campaign=events-section`;

const DateBadge = ({ month, day }: { month: string; day: string }) => {
  return (
    <div className="relative size-16 lg:size-20 bg-white rounded-lg lg:rounded-lg shadow-[0px_1.6px_4.8px_1.6px_rgba(0,0,0,0.05),0px_0.8px_1.6px_0px_rgba(0,0,0,0.15)] lg:shadow-[0px_2px_6px_2px_rgba(0,0,0,0.05),0px_1px_2px_0px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col">
      {/* Month Label */}
      <div className="relative flex items-center justify-center py-[4.8px] lg:py-1.5 border-b border-bluedot-navy/10 bg-gradient-to-r from-blue-600 to-blue-500">
        <span className="text-size-xxs lg:text-size-xs font-semibold uppercase tracking-[0.4px] lg:tracking-[0.5px] text-white leading-[11.2px] lg:leading-[14px]">
          {month}
        </span>
      </div>

      {/* Day Number */}
      <div className="relative flex items-center justify-center h-[43.2px] lg:h-[54px]">
        <span className="text-[32px] lg:text-[40px] font-normal text-bluedot-navy tracking-[-0.8px] lg:tracking-[-1px] leading-tight">
          {day}
        </span>
      </div>
    </div>
  );
};

const EventCard = ({ event }: { event: Event }) => {
  const startDate = new Date(event.startAt);
  const month = startDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = startDate.getDate().toString();

  const timeString = buildTimeDeltaString(event);

  return (
    <div className="flex flex-col gap-8 bd-md:gap-7 lg:gap-8 xl:gap-12 min-h-[216px] bd-md:min-h-[208px] lg:min-h-[232px] xl:min-h-[248px] pl-6 border-l border-bluedot-navy/15 w-[232px] bd-md:w-auto flex-shrink-0 bd-md:flex-shrink bd-md:flex-grow bd-md:basis-0">
      <DateBadge month={month} day={day} />

      <div className="flex flex-col gap-3">
        <p className="text-size-xxs font-medium uppercase tracking-[0.5px] leading-[14px] text-[#271dcd]">
          {event.location}
        </p>
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-size-md bd-md:text-size-lg font-normal leading-[1.3] tracking-[-0.4px] bd-md:tracking-[-0.18px] text-bluedot-navy hover:text-[#271dcd] transition-colors"
          aria-label={`${event.title} (opens in new tab)`}
        >
          <h3>
            {event.title}
          </h3>
        </a>
        <p className="text-size-sm font-normal leading-[1.55] tracking-[-0.032px] text-bluedot-navy/70">
          {timeString}
        </p>
      </div>
    </div>
  );
};

const PhotoCarousel = ({ photos }: { photos: Photo[] }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isResettingRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);

  const createInfiniteScrollData = () => {
    if (photos.length === 0) {
      return [];
    }

    return [...photos, ...photos, ...photos];
  };

  const infinitePhotos = createInfiniteScrollData();

  const getPhotoGap = useCallback(() => {
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
        const currentScrollLeft = scrollContainerRef.current.scrollLeft;
        const newScrollLeft = currentScrollLeft + CAROUSEL_CONFIG.SCROLL_SPEED;

        scrollContainerRef.current.scrollTo({
          left: newScrollLeft,
          behavior: 'auto',
        });
      }
    }, CAROUSEL_CONFIG.AUTO_SCROLL_INTERVAL);
  }, []);

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

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleFocus = () => {
    setIsHovered(true);
  };

  const handleBlur = () => {
    setIsHovered(false);
  };

  useEffect(() => {
    if (scrollContainerRef.current && photos.length > 0) {
      const totalWidth = photos.reduce((sum, photo) => sum + photo.width + getPhotoGap(), 0);
      scrollContainerRef.current.scrollLeft = totalWidth;
    }
  }, [photos, getPhotoGap]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container && !isResettingRef.current && photos.length > 0) {
      const { scrollLeft } = container;
      const gap = getPhotoGap();
      const sectionWidth = photos.reduce((sum, photo) => sum + photo.width + gap, 0);

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
  };

  return (
    <div className="relative -mx-5 bd-md:-mx-8 lg:-mx-12 xl:-mx-16 2xl:-mx-20">
      <div
        ref={scrollContainerRef}
        className="flex flex-nowrap overflow-x-auto scrollbar-none gap-5 bd-md:gap-6 lg:gap-8"
        style={{
          scrollSnapType: 'none',
          scrollBehavior: 'auto',
        }}
        onScroll={handleScroll}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}

        tabIndex={0}
        role="region"
        aria-label="Event photos carousel"
      >
        {infinitePhotos.map((photo, index) => {
          const sectionNumber = Math.floor(index / photos.length);
          const uniqueKey = `${photo.id}-${index}-${sectionNumber}`;
          const photoNumber = (index % photos.length) + 1;
          return (
            <a
              key={uniqueKey}
              href={EVENTS_SECTION_URL}
              className="flex-shrink-0"
              aria-label={`View BlueDot event photo ${photoNumber} of ${photos.length}`}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="h-[240px] bd-md:h-[150px] lg:h-[193px] rounded-xl lg:rounded-xl border border-bluedot-navy/10 object-cover object-center"
                style={{ width: `${photo.width}px` }}
              />
            </a>
          );
        })}
      </div>
    </div>
  );
};

const EventsSection = () => {
  const { data: events, isLoading } = trpc.luma.getUpcomingEvents.useQuery();
  const displayEvents = (events ?? []).slice(0, 4);

  return (
    <section
      className="w-full py-12 px-5 bd-md:py-16 bd-md:px-8 lg:py-20 lg:px-12 xl:py-24 xl:px-16 2xl:px-20"
      aria-labelledby="events-section-heading"
    >
      {/* Heading Section */}
      <div className="mx-auto max-w-screen-xl">
        <div className="flex flex-col items-center text-center gap-8 bd-md:gap-12 mb-12 xl:mb-16">
          <h2
            id="events-section-heading"
            className="text-[28px] bd-md:text-[36px] lg:text-[40px] xl:text-[48px] font-medium leading-[125%] text-bluedot-navy tracking-[-1px] max-w-[666px]"
            style={{ fontFeatureSettings: '\'ss04\' on' }}
          >
            Join an event near you
          </h2>
        </div>
      </div>

      {/* Photo Carousel with full-bleed */}
      <div className="mb-16 lg:mb-20">
        <PhotoCarousel photos={BLUEDOT_EVENTS_PHOTOS} />
      </div>

      {/* Event Cards */}
      <div className="mx-auto max-w-screen-xl">
        <div className="flex flex-col items-center gap-16 lg:gap-20">
          {isLoading && <ProgressDots />}

          {!isLoading && displayEvents.length > 0 && (
            <>
              <div className="w-full">
                {/* Mobile: horizontal scroll carousel */}
                <div className="flex overflow-x-auto scrollbar-none gap-6 bd-md:hidden">
                  {displayEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>

                {/* Tablet 2×2 grid */}
                <div className="hidden bd-md:grid xl:hidden grid-cols-2 gap-x-4 gap-y-16">
                  {displayEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>

                {/* Desktop: single row */}
                <div className="hidden xl:flex gap-4">
                  {displayEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>

              {/* CTA Button - visible on all screen sizes */}
              <CTALinkOrButton
                url={EVENTS_SECTION_URL}
                className="flex h-[44px] px-[17px] text-size-xs font-normal leading-[18.2px] tracking-[0.42px] text-white bg-[#0033CC] rounded-[6px] hover:bg-[#0029A3] transition-all duration-200 whitespace-nowrap"
              >
                See upcoming events
              </CTALinkOrButton>
            </>
          )}

          {!isLoading && displayEvents.length === 0 && (
            <p className="text-size-sm font-normal leading-[1.55] tracking-[-0.032px] text-bluedot-navy/70">
              No upcoming events at the moment. Check back soon!
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
export { buildTimeDeltaString };
