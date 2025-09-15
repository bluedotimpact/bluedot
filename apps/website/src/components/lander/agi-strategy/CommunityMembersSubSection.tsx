import {
  useRef,
  useState,
  useEffect,
  useMemo,
} from 'react';
import Link from 'next/link';
import { SectionHeading } from '@bluedot/ui';
import clsx from 'clsx';

export type CommunityMember = {
  name: string;
  jobTitle: string;
  course: string;
  imageSrc: string;
  url: string;
};

type CommunityMembersSubSectionProps = {
  members: CommunityMember[];
  title?: string;
};

// Card configuration constants
const CARD_CONFIG = {
  DESKTOP_WIDTH: 320,
  MOBILE_WIDTH: 280,
  GAP: 24,
  PADDING: 0,
  MOBILE_BREAKPOINT: 768,
} as const;

// Community Member Card Component
const CommunityMemberCard = ({ member, isCarousel = false }: { member: CommunityMember; isCarousel?: boolean }) => (
  <Link
    href={member.url}
    target="_blank"
    rel="noopener noreferrer"
    className={clsx(
      'community-member flex flex-col border border-[#E7E5E4] rounded-lg p-8 bg-white gap-6',
      isCarousel ? 'flex-shrink-0 w-80 h-full' : 'h-full',
    )}
  >
    <div className="community-member__content flex-grow flex flex-col justify-center items-center text-center gap-4">
      <div className="community-member__avatar size-32 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={member.imageSrc}
          alt={`Profile of ${member.name}`}
          className="size-full object-cover"
        />
      </div>
      <div className="community-member__info flex flex-col gap-2">
        <div className="community-member__name font-semibold text-size-base leading-normal text-[#13132E]">
          {member.name}
        </div>
        <div className="community-member__job-title text-size-sm leading-[1.4] text-[#13132E] opacity-80">
          {member.jobTitle}
        </div>
        <div className="community-member__course text-size-xs leading-[20px] text-[#13132E] opacity-70 font-medium">
          {member.course}
        </div>
      </div>
    </div>
  </Link>
);

// Carousel Navigation Button Component
const CarouselButton = ({
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
      'absolute top-1/2 -translate-y-1/2 z-10 size-12 rounded-full bg-white border border-[#E7E5E4] shadow-lg flex items-center justify-center transition-all duration-200',
      'hover:bg-gray-50 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed',
      direction === 'left' ? '-left-6' : '-right-6',
    )}
    aria-label={`Scroll ${direction}`}
  >
    <svg
      className={clsx('size-5 text-[#13132E]', direction === 'right' && 'rotate-180')}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
);

const CommunityMembersSubSection = ({
  members,
  title,
}: CommunityMembersSubSectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showCarousel, setShowCarousel] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const isScrollingRef = useRef(false);

  // Memoized card capacity calculation using constants
  const cardCapacity = useMemo(() => {
    if (containerWidth === 0) return 0;

    const availableWidth = containerWidth - CARD_CONFIG.PADDING;
    // Use DESKTOP_WIDTH consistently since CSS uses w-80 (320px) for all cards
    const actualCardWidth = CARD_CONFIG.DESKTOP_WIDTH;

    return Math.max(1, Math.floor(availableWidth / (actualCardWidth + CARD_CONFIG.GAP)));
  }, [containerWidth]);

  // Create infinite scroll data by duplicating members
  const createInfiniteScrollData = () => {
    if (members.length === 0) return [];

    // For infinite scroll, we need at least 3 copies to ensure smooth transitions
    // Structure: [...members, ...members, ...members]
    return [...members, ...members, ...members];
  };

  const infiniteMembers = createInfiniteScrollData();

  // Determine if we should show carousel based on container width
  useEffect(() => {
    if (containerWidth > 0) {
      setShowCarousel(members.length > cardCapacity);
    }
  }, [members.length, containerWidth, cardCapacity]);

  // ResizeObserver to monitor container width
  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;

    if (containerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });

      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Initialize scroll position to middle section for infinite scroll
  useEffect(() => {
    if (showCarousel && scrollContainerRef.current && members.length > 0) {
      const cardWidth = CARD_CONFIG.DESKTOP_WIDTH + CARD_CONFIG.GAP;
      const middlePosition = members.length * cardWidth;
      scrollContainerRef.current.scrollLeft = middlePosition;
    }
  }, [showCarousel, members.length]);

  // Handle infinite scroll logic
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container && !isScrollingRef.current && members.length > 0) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const cardWidth = CARD_CONFIG.DESKTOP_WIDTH + CARD_CONFIG.GAP;
      const sectionWidth = members.length * cardWidth;

      // Check if we need to reset position for infinite scroll
      if (scrollLeft <= 0) {
        // Scrolled to the beginning, jump to the end of the first section
        isScrollingRef.current = true;
        container.scrollLeft = sectionWidth;
        requestAnimationFrame(() => {
          isScrollingRef.current = false;
        });
      } else if (scrollLeft >= scrollWidth - clientWidth) {
        // Scrolled to the end, jump to the beginning of the second section
        isScrollingRef.current = true;
        container.scrollLeft = sectionWidth;
        requestAnimationFrame(() => {
          isScrollingRef.current = false;
        });
      }
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = CARD_CONFIG.DESKTOP_WIDTH + CARD_CONFIG.GAP;
      const newScrollLeft = scrollContainerRef.current.scrollLeft
        + (direction === 'right' ? scrollAmount : -scrollAmount);

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  if (showCarousel) {
    return (
      <div ref={containerRef} className="community-members-section w-full" data-testid="community-members-section">
        {title && <SectionHeading title={title} titleLevel="h3" className="community-members-section__heading mb-8" />}

        {/* Horizontal Scrolling Carousel */}
        <div className="relative">
          {/* Hidden description for screen readers */}
          <div id="carousel-description" className="sr-only">
            This carousel uses infinite scrolling. Navigation buttons will continuously scroll through community members without reaching an end.
          </div>

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hidden pb-4"
            style={{
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            onScroll={handleScroll}
            aria-describedby="carousel-description"
          >
            {infiniteMembers.map((member, index) => {
              const sectionNumber = Math.floor(index / members.length);
              return (
                <div key={`${member.name}-${sectionNumber}`} style={{ scrollSnapAlign: 'start' }}>
                  <CommunityMemberCard member={member} isCarousel />
                </div>
              );
            })}
          </div>

          {/* Navigation Buttons - Always enabled for infinite scroll */}
          <CarouselButton
            direction="left"
            onClick={() => scroll('left')}
            disabled={false}
          />
          <CarouselButton
            direction="right"
            onClick={() => scroll('right')}
            disabled={false}
          />
        </div>
      </div>
    );
  }

  // Default flex layout when all members fit in single row
  return (
    <div ref={containerRef} className="community-members-section w-full" data-testid="community-members-section">
      {title && <SectionHeading title={title} titleLevel="h3" className="community-members-section__heading" />}

      {/* Single Row Flex Layout */}
      <div className="flex gap-6 justify-center flex-wrap">
        {members.map((member) => (
          <div key={member.name} className="w-80">
            <CommunityMemberCard key={member.name} member={member} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityMembersSubSection;
