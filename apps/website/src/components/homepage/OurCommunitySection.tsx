import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import Link from 'next/link';
import { NewText } from '@bluedot/ui';
import clsx from 'clsx';

type CommunityMember = {
  name: string;
  jobTitle: string;
  course: string;
  imageSrc: string;
  url: string;
};

const COMMUNITY_MEMBERS: CommunityMember[] = [
  {
    name: 'Neel Nanda',
    jobTitle: 'Mech Interp Lead at Google DeepMind',
    course: 'Former participant and facilitator',
    imageSrc: '/images/graduates/neel.jpeg',
    url: 'https://www.neelnanda.io/about',
  },
  {
    name: 'Catherine Fist',
    jobTitle: 'Head of Delivery at UK AISI',
    course: 'AI Governance Course Graduate',
    imageSrc: '/images/graduates/catherine.jpeg',
    url: 'https://www.linkedin.com/in/catherine-fist/',
  },
  {
    name: 'Adam Jones',
    jobTitle: 'Member of Technical Staff at Anthropic',
    course: 'Former AI safety lead at BlueDot',
    imageSrc: '/images/graduates/adam.jpg',
    url: 'https://adamjones.me/',
  },
  {
    name: 'Marius Hobbhahn',
    jobTitle: 'CEO at Apollo Research',
    course: 'AI Alignment Course Graduate',
    imageSrc: '/images/graduates/marius.jpeg',
    url: 'https://www.mariushobbhahn.com/aboutme/',
  },
  {
    name: 'Chiara Gerosa',
    jobTitle: 'Executive Director at Talos',
    course: 'AI Governance Course Facilitator',
    imageSrc: '/images/graduates/chiara.jpeg',
    url: 'https://www.linkedin.com/in/chiaragerosa/',
  },
  {
    name: 'Richard Ngo',
    jobTitle: 'Former OpenAI and DeepMind',
    course: 'AI Alignment Course Designer',
    imageSrc: '/images/graduates/richard.jpg',
    url: 'https://www.richardcngo.com/',
  },
];

const CARD_CONFIG = {
  AUTO_SCROLL_INTERVAL: 3000,
} as const;

const CommunityMemberCard = ({ member }: { member: CommunityMember }) => (
  <Link
    href={member.url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex flex-col flex-shrink-0 bg-white border border-[rgba(19,19,46,0.1)] rounded-xl overflow-hidden cursor-pointer w-[276px] min-[680px]:w-[288px] min-[1280px]:w-[320px] h-auto"
  >
    {/* Image Section */}
    <div className="flex-shrink-0 w-full h-[296px] min-[680px]:h-[320px]">
      <img
        src={member.imageSrc}
        alt={`Profile of ${member.name}`}
        className="size-full object-cover"
      />
    </div>

    {/* Content Section */}
    <div className="flex flex-col items-start justify-between p-6 gap-4 min-h-[157px]">
      {/* Name and Job Title Container */}
      <div className="flex flex-col items-start gap-1 w-full">
        {/* Name */}
        <NewText.P className="text-[18px] font-semibold leading-[125%] text-[#13132E] text-left w-full">
          {member.name}
        </NewText.P>

        {/* Job Title */}
        <NewText.P className="text-[14px] font-medium leading-[160%] text-[#13132E] text-left w-full self-stretch">
          {member.jobTitle}
        </NewText.P>
      </div>

      {/* Course */}
      <NewText.P className="text-[14px] font-normal leading-[160%] text-[#13132E] text-left w-full opacity-60">
        {member.course}
      </NewText.P>
    </div>
  </Link>
);

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

const OurCommunitySection = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isResettingRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);

  const createInfiniteScrollData = () => {
    if (COMMUNITY_MEMBERS.length === 0) return [];
    return [...COMMUNITY_MEMBERS, ...COMMUNITY_MEMBERS, ...COMMUNITY_MEMBERS];
  };

  const infiniteMembers = createInfiniteScrollData();

  const getCardWidth = useCallback(() => {
    if (typeof window === 'undefined') return 320;
    const width = window.innerWidth;
    if (width >= 1280) return 320;
    if (width >= 680) return 288;
    return 276;
  }, []);

  const getCardGap = useCallback(() => {
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
    if (scrollContainerRef.current && COMMUNITY_MEMBERS.length > 0) {
      const cardWidth = getCardWidth();
      const gap = getCardGap();
      const scrollUnit = cardWidth + gap;
      const sectionWidth = COMMUNITY_MEMBERS.length * scrollUnit;
      scrollContainerRef.current.scrollLeft = sectionWidth;
    }
  }, [getCardWidth, getCardGap]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container && !isResettingRef.current && COMMUNITY_MEMBERS.length > 0) {
      const { scrollLeft } = container;
      const cardWidth = getCardWidth();
      const gap = getCardGap();
      const scrollUnit = cardWidth + gap;
      const sectionWidth = COMMUNITY_MEMBERS.length * scrollUnit;

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
  }, [getCardWidth, getCardGap]);

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
      {/* Header Container - aligned with course cards */}
      <div className="mx-auto max-w-screen-xl mb-8 min-[680px]:mb-16 min-[1024px]:mb-20 min-[1440px]:mb-16">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center min-[680px]:flex-row min-[680px]:items-end min-[680px]:justify-between min-[680px]:text-left gap-8 min-[680px]:gap-16">
          {/* Header Content */}
          <div className="flex flex-col gap-8">
            <h2 className="text-[28px] min-[680px]:text-[36px] min-[1024px]:text-[40px] min-[1280px]:text-[48px] font-medium leading-[125%] text-[#13132E] tracking-[-1px]" style={{ fontFeatureSettings: "'ss04' on" }}>
              Our community
            </h2>
            <NewText.P className="text-[16px] min-[680px]:text-[18px] font-normal leading-[160%] text-[#13132E] opacity-80 max-w-full">
              Learn more about the incredible work our community is doing.
            </NewText.P>
          </div>

          {/* Navigation Buttons */}
          <div className="hidden min-[680px]:flex gap-3 flex-shrink-0">
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

      {/* Carousel Container - full bleed on both sides */}
      <div className="relative -mx-5 min-[680px]:-mx-8 lg:-mx-12 xl:-mx-16 2xl:-mx-20">
        <div id="our-community-carousel-description" className="sr-only">
          This carousel uses infinite scrolling and auto-advances every few seconds. Hover to pause auto-scrolling. Use arrow keys to navigate when focused. Navigation buttons allow manual control.
        </div>

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
          aria-label="Our community carousel"
          aria-describedby="our-community-carousel-description"
        >
          {infiniteMembers.map((member, index) => {
            const sectionNumber = Math.floor(index / COMMUNITY_MEMBERS.length);
            const uniqueKey = `${member.name}-${index}-${sectionNumber}`;
            return (
              <div key={uniqueKey}>
                <CommunityMemberCard member={member} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Navigation Buttons - centered below carousel */}
      <div className="flex min-[680px]:hidden gap-3 justify-center mt-8">
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
    </section>
  );
};

export default OurCommunitySection;
