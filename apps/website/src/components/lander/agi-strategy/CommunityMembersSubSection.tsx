import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import Link from 'next/link';
import { NewText } from '@bluedot/ui';
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
  WIDTH: 280,
  HEIGHT: 437,
  GAP: 32,
  PADDING: 0,
  AUTO_SCROLL_INTERVAL: 3000, // 3 seconds
} as const;

// Community Member Card Component
const CommunityMemberCard = ({ member }: { member: CommunityMember }) => (
  <Link
    href={member.url}
    target="_blank"
    rel="noopener noreferrer"
    className="community-member flex flex-col flex-shrink-0 bg-white border border-[rgba(19,19,46,0.1)] rounded-xl overflow-hidden"
    style={{
      width: `${CARD_CONFIG.WIDTH}px`,
      height: `${CARD_CONFIG.HEIGHT}px`,
    }}
  >
    {/* Image Section */}
    <div className="community-member__image-container flex-shrink-0" style={{ width: '280px', height: '280px' }}>
      <img
        src={member.imageSrc}
        alt={`Profile of ${member.name}`}
        className="size-full object-cover"
      />
    </div>

    {/* Content Section */}
    <div className="community-member__content flex flex-col items-start justify-between p-6 gap-4 h-[157px]">
      {/* Name and Job Title Container */}
      <div className="community-member__info flex flex-col items-start gap-1 w-[232px]">
        {/* Name */}
        <NewText.P className="community-member__name text-[18px] font-semibold leading-[125%] text-[#13132E] text-left w-full">
          {member.name}
        </NewText.P>

        {/* Job Title */}
        <NewText.P className="community-member__job-title text-[14px] font-medium leading-[160%] text-[#13132E] text-left w-full self-stretch">
          {member.jobTitle}
        </NewText.P>
      </div>

      {/* Course */}
      <NewText.P className="community-member__course text-[14px] font-normal leading-[160%] text-[#13132E] text-left w-[232px] opacity-60">
        {member.course}
      </NewText.P>
    </div>
  </Link>
);

// Header Navigation Button Component
const HeaderNavigationButton = ({
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
      'size-12 rounded-full flex items-center justify-center transition-all duration-200',
      'hover:opacity-100 disabled:cursor-not-allowed',
      disabled ? 'opacity-30' : 'opacity-30 hover:opacity-60',
    )}
    style={{
      background: 'rgba(19, 19, 46, 0.1)',
    }}
    aria-label={`Scroll ${direction}`}
  >
    <span
      className="text-[22.4px] font-medium text-[#13132E] inline-flex items-center justify-center"
      style={{
        transform: direction === 'left' ? 'scaleX(-1)' : 'none',
        lineHeight: 1,
        width: '24px',
        height: '24px',
      }}
    >
      →
    </span>
  </button>
);

const CommunityMembersSubSection = ({
  members,
  title,
}: CommunityMembersSubSectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isResettingRef = useRef(false);

  // Create infinite scroll data - 3 copies for smooth looping
  const createInfiniteScrollData = () => {
    if (members.length === 0) return [];
    // 3 copies: [buffer][main][buffer]
    return [...members, ...members, ...members];
  };

  const infiniteMembers = createInfiniteScrollData();

  // Auto-scroll functionality
  const startAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }

    autoScrollIntervalRef.current = setInterval(() => {
      if (scrollContainerRef.current && !isResettingRef.current) {
        const scrollAmount = CARD_CONFIG.WIDTH + CARD_CONFIG.GAP;
        const currentScrollLeft = scrollContainerRef.current.scrollLeft;
        const newScrollLeft = currentScrollLeft + scrollAmount;

        scrollContainerRef.current.scrollTo({
          left: newScrollLeft,
          behavior: 'smooth',
        });
      }
    }, CARD_CONFIG.AUTO_SCROLL_INTERVAL);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  // Start auto-scroll on mount and restart when hover state changes
  useEffect(() => {
    if (!isHovered) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
    return () => {
      stopAutoScroll();
    };
  }, [isHovered, startAutoScroll, stopAutoScroll]);

  // Handle hover state for auto-scroll
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Initialize scroll position to middle section
  useEffect(() => {
    if (scrollContainerRef.current && members.length > 0) {
      const cardWidth = CARD_CONFIG.WIDTH + CARD_CONFIG.GAP;
      const sectionWidth = members.length * cardWidth;
      // Start at the beginning of the middle section
      scrollContainerRef.current.scrollLeft = sectionWidth;
    }
  }, [members.length]);

  // Handle infinite scroll with seamless reset
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container && !isResettingRef.current && members.length > 0) {
      const { scrollLeft } = container;
      const cardWidth = CARD_CONFIG.WIDTH + CARD_CONFIG.GAP;
      const sectionWidth = members.length * cardWidth;
      // We want to reset when we're exactly one section away from the visible edges
      // This ensures the same cards remain visible during reset
      if (scrollLeft >= sectionWidth * 2) {
        // Scrolled a full section past middle, reset back exactly one section
        isResettingRef.current = true;
        container.scrollLeft = scrollLeft - sectionWidth;
        isResettingRef.current = false;
      } else if (scrollLeft < sectionWidth) {
        // Scrolled a full section before middle, reset forward exactly one section
        isResettingRef.current = true;
        container.scrollLeft = scrollLeft + sectionWidth;
        isResettingRef.current = false;
      }
    }
  }, [members.length]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = CARD_CONFIG.WIDTH + CARD_CONFIG.GAP;
      const newScrollLeft = scrollContainerRef.current.scrollLeft
        + (direction === 'right' ? scrollAmount : -scrollAmount);

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <section className="community-members-section w-full bg-[#FAFAF7] py-12 md:py-20 lg:py-24" data-testid="community-members-section">
      {/* Header Container - constrained to content width */}
      <div className="mx-auto px-5 md:px-12 lg:px-40 max-w-[1440px] mb-16">
        {/* Custom Header Section */}
        <div className="flex flex-col items-center text-center lg:flex-row lg:items-end lg:justify-between lg:text-left gap-8 lg:gap-16">
          {/* Header Content */}
          <div className="flex flex-col gap-6">
            <NewText.H2 className="text-[28px] md:text-[32px] lg:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-[#13132E] tracking-[-0.01em]">
              {title || 'Meet our Alumni Shaping AI\'s Future'}
            </NewText.H2>
            <NewText.P className="text-[18px] font-normal leading-[160%] text-[#13132E] opacity-80 max-w-full lg:max-w-[610px] xl:max-w-[639px]">
              Our students and graduates work at some of the most respectable AI organizations in the world. Here are a few of the people who graduated from Blue Dot:
            </NewText.P>
          </div>

          {/* Navigation Buttons */}
          <div className="hidden lg:flex gap-3 flex-shrink-0">
            <HeaderNavigationButton
              direction="left"
              onClick={() => scroll('left')}
              disabled={false}
            />
            <HeaderNavigationButton
              direction="right"
              onClick={() => scroll('right')}
              disabled={false}
            />
          </div>
        </div>
      </div>

      {/* Carousel Container - full width for bleed effect */}
      <div className="relative w-full overflow-hidden">
        {/* Hidden description for screen readers */}
        <div id="carousel-description" className="sr-only">
          This carousel uses infinite scrolling and auto-advances every few seconds. Hover to pause auto-scrolling. Navigation buttons allow manual control.
        </div>

        <div
          ref={scrollContainerRef}
          className="flex flex-nowrap overflow-x-auto scrollbar-none px-5 md:px-12 lg:px-40 xl:pl-[max(160px,_calc((100vw-1120px)/2))] xl:pr-8"
          style={{
            gap: `${CARD_CONFIG.GAP}px`,
            scrollSnapType: 'none', // Disable snap to prevent interference with smooth scroll
            scrollBehavior: 'auto', // Let us control the scroll behavior
          }}
          onScroll={handleScroll}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          aria-describedby="carousel-description"
        >
          {infiniteMembers.map((member, index) => {
            const sectionNumber = Math.floor(index / members.length);
            const uniqueKey = `${member.name}-${index}-${sectionNumber}`;
            return (
              <div key={uniqueKey}>
                <CommunityMemberCard member={member} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CommunityMembersSubSection;
