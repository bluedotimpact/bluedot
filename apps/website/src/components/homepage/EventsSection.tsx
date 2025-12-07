import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { CTALinkOrButton, ProgressDots } from '@bluedot/ui';
import { trpc } from '../../utils/trpc';
import type { Event } from '../../server/routers/luma';

type Photo = {
  id: string;
  src: string;
  alt: string;
  width: number;
};

const BLUEDOT_EVENTS_PHOTOS: Photo[] = [
  {
    id: '1', src: '/images/homepage/events-1.png', alt: 'BlueDot event', width: 512,
  },
  {
    id: '2', src: '/images/homepage/events-2.png', alt: 'BlueDot event', width: 647,
  },
  {
    id: '3', src: '/images/homepage/events-3.png', alt: 'BlueDot event', width: 512,
  },
  {
    id: '4', src: '/images/homepage/events-4.png', alt: 'BlueDot event', width: 499,
  },
  {
    id: '5', src: '/images/homepage/events-5.png', alt: 'BlueDot event', width: 325,
  },
  {
    id: '6', src: '/images/homepage/events-6.png', alt: 'BlueDot event', width: 512,
  },
  {
    id: '7', src: '/images/homepage/events-7.png', alt: 'BlueDot event', width: 433,
  },
  {
    id: '8', src: '/images/homepage/events-8.png', alt: 'BlueDot event', width: 325,
  },
  {
    id: '9', src: '/images/homepage/events-9.png', alt: 'BlueDot event', width: 637,
  },
  {
    id: '10', src: '/images/homepage/events-10.png', alt: 'BlueDot event', width: 637,
  },
];

const CAROUSEL_CONFIG = {
  AUTO_SCROLL_INTERVAL: 50, // 50ms intervals for smooth continuous scrolling
  SCROLL_SPEED: 0.75, // pixels per interval (0.75px * 20 intervals/sec = 15px/sec)
} as const;

const DateBadge = ({ month, day }: { month: string; day: string }) => {
  return (
    <div className="relative size-16 min-[1024px]:size-20 bg-white rounded-lg min-[1024px]:rounded-lg shadow-[0px_1.6px_4.8px_1.6px_rgba(0,0,0,0.05),0px_0.8px_1.6px_0px_rgba(0,0,0,0.15)] min-[1024px]:shadow-[0px_2px_6px_2px_rgba(0,0,0,0.05),0px_1px_2px_0px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col">
      {/* Month Label */}
      <div className="relative flex items-center justify-center py-[4.8px] min-[1024px]:py-1.5 border-b border-[rgba(19,19,46,0.1)] bg-gradient-to-r from-blue-600 to-blue-500">
        <span className="text-[11.2px] min-[1024px]:text-[14px] font-semibold uppercase tracking-[0.4px] min-[1024px]:tracking-[0.5px] text-white leading-[11.2px] min-[1024px]:leading-[14px]">
          {month}
        </span>
      </div>

      {/* Day Number */}
      <div className="relative flex items-center justify-center h-[43.2px] min-[1024px]:h-[54px]">
        <span className="text-[32px] min-[1024px]:text-[40px] font-normal text-[#13132e] tracking-[-0.8px] min-[1024px]:tracking-[-1px] leading-tight">
          {day}
        </span>
      </div>
    </div>
  );
};

/** Given a transformed Luma event, returns a time delta string:
 * 1. If the event is online, the time delta is shown in local user time, e.g. "Mon 9:00 am - 5:00 pm GMT+2" (for a user in
 *    GMT+2)
 * 2. If the event is in-person, the time delta is shown in the event's timezone, e.g. "Mon 2 pm - 5 pm GMT" (even if user
 *    in GMT+2)
 * 3. If the event is shown over multiple days, the end date is in brackets with timezone after, e.g. "Mon 9:00 am - Fri 5:00 pm (5 Mar) GMT"
 */
export const buildTimeDeltaString = (event: Event, locale?: string) => {
  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);
  const timeZone = event.location === 'ONLINE' ? undefined : event.timezone;

  // Check if event spans multiple days
  const dateComparator = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone,
  });
  const isMultiDay = dateComparator.format(startDate) !== dateComparator.format(endDate);

  const formatTime = (date: Date, extraOptions: Intl.DateTimeFormatOptions = {}) => {
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone,
      ...extraOptions,
    }).format(date);
  };

  const timeStart = formatTime(startDate, { weekday: 'short' });

  if (isMultiDay) {
    // For multi-day: "Weekday Time (Date) Timezone"
    const timeEndWeekday = formatTime(endDate, { weekday: 'short' });
    const timeEndDate = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      timeZone,
    }).format(endDate);

    // Extract timezone abbreviation
    const timezoneParts = new Intl.DateTimeFormat(locale, {
      timeZoneName: 'short',
      timeZone,
    }).formatToParts(endDate);
    const timezone = timezoneParts.find((part) => part.type === 'timeZoneName')?.value || '';

    return `${timeStart} - ${timeEndWeekday} (${timeEndDate}) ${timezone}`;
  }

  // For single-day: "Weekday Time - Time Timezone"
  const timeEnd = formatTime(endDate, { timeZoneName: 'short' });
  return `${timeStart} - ${timeEnd}`;
};

const EventCard = ({ event }: { event: Event }) => {
  const startDate = new Date(event.startAt);
  const month = startDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = startDate.getDate().toString();

  const timeString = buildTimeDeltaString(event);

  return (
    <div className="flex flex-col justify-between h-[264px] min-[680px]:min-h-[248px] min-[1024px]:min-h-[280px] min-[1280px]:min-h-[320px] pl-6 border-l border-[rgba(19,19,46,0.15)] w-[232px] min-[680px]:w-auto flex-shrink-0 min-[680px]:flex-shrink min-[680px]:flex-grow min-[680px]:basis-0">
      <DateBadge month={month} day={day} />

      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.5px] leading-[14px] text-[#271dcd]">
          {event.location}
        </p>
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[20px] min-[680px]:text-[24px] font-normal leading-[1.3] tracking-[-0.4px] min-[680px]:tracking-[-0.18px] text-[#13132e] hover:text-[#271dcd] transition-colors"
          aria-label={`${event.title} (opens in new tab)`}
        >
          <h3>
            {event.title}
          </h3>
        </a>
        <p className="text-[16px] font-normal leading-[1.55] tracking-[-0.032px] text-[#13132e] opacity-70">
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
    if (photos.length === 0) return [];
    return [...photos, ...photos, ...photos];
  };

  const infinitePhotos = createInfiniteScrollData();

  const getPhotoGap = useCallback(() => {
    if (typeof window === 'undefined') return 32;
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
    <div className="relative -mx-5 min-[680px]:-mx-8 min-[1024px]:-mx-12 min-[1280px]:-mx-16 2xl:-mx-20">
      <div
        ref={scrollContainerRef}
        className="flex flex-nowrap overflow-x-auto scrollbar-none gap-5 min-[680px]:gap-6 min-[1024px]:gap-8"
        style={{
          scrollSnapType: 'none',
          scrollBehavior: 'auto',
        }}
        onScroll={handleScroll}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
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
              href="https://luma.com/bluedotevents?utm_source=website&utm_campaign=events-section"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
              aria-label={`View BlueDot event photo ${photoNumber} of ${photos.length} (opens in new tab)`}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="h-[240px] min-[680px]:h-[300px] min-[1024px]:h-[385px] rounded-xl min-[1024px]:rounded-xl border border-[rgba(19,19,46,0.1)] object-cover object-center"
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
  const displayEvents = (events || []).slice(0, 4);

  return (
    <section
      className="w-full bg-white py-12 px-5 min-[680px]:py-16 min-[680px]:px-8 min-[1024px]:py-20 min-[1024px]:px-12 min-[1280px]:py-24 min-[1280px]:px-16 2xl:px-20"
      aria-labelledby="events-section-heading"
    >
      {/* Heading Section */}
      <div className="mx-auto max-w-screen-xl">
        <div className="flex flex-col items-center text-center gap-8 min-[680px]:gap-12 min-[1024px]:gap-12 min-[1280px]:gap-12 mb-12 min-[680px]:mb-12 min-[1024px]:mb-12 min-[1280px]:mb-16">
          <h2
            id="events-section-heading"
            className="text-[28px] min-[680px]:text-[36px] min-[1024px]:text-[40px] min-[1280px]:text-[48px] font-medium leading-[125%] text-[#13132E] tracking-[-1px] max-w-[666px]"
            style={{ fontFeatureSettings: "'ss04' on" }}
          >
            Join an event near you
          </h2>
        </div>
      </div>

      {/* Photo Carousel with full-bleed */}
      <div className="mb-16 min-[680px]:mb-16 min-[1024px]:mb-20 min-[1280px]:mb-20">
        <PhotoCarousel photos={BLUEDOT_EVENTS_PHOTOS} />
      </div>

      {/* Event Cards */}
      <div className="mx-auto max-w-screen-xl">
        <div className="flex flex-col items-center gap-16 min-[1024px]:gap-20">
          {isLoading && <ProgressDots />}

          {!isLoading && displayEvents.length > 0 && (
            <>
              <div className="w-full">
                {/* Mobile: horizontal scroll carousel */}
                <div className="flex overflow-x-auto scrollbar-none gap-6 min-[680px]:hidden">
                  {displayEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>

                {/* Tablet 2×2 grid */}
                <div className="hidden min-[680px]:grid min-[1280px]:hidden grid-cols-2 gap-x-4 gap-y-16">
                  {displayEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>

                {/* Desktop: single row */}
                <div className="hidden min-[1280px]:flex gap-4">
                  {displayEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>

              {/* CTA Button - below cards for tablet/desktop */}
              <CTALinkOrButton
                url="https://luma.com/bluedotevents?utm_source=website&utm_campaign=events-section"
                target="_blank"
                className="hidden min-[680px]:flex h-[44px] px-[17px] text-[14px] font-normal leading-[18.2px] tracking-[0.42px] text-white bg-[#0033CC] rounded-[6px] hover:bg-[#0029A3] transition-all duration-200 whitespace-nowrap"
              >
                See upcoming events
              </CTALinkOrButton>
            </>
          )}

          {!isLoading && displayEvents.length === 0 && (
            <p className="text-[16px] font-normal leading-[1.55] tracking-[-0.032px] text-[#13132e] opacity-70">
              No upcoming events at the moment. Check back soon!
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
