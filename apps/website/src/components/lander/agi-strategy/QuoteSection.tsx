import {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { Quote } from '@bluedot/ui';
import { useAboveBreakpoint } from '@bluedot/ui/src/hooks/useBreakpoint';

type QuoteWithUrl = Quote & {
  url: string;
};

const COLORS = {
  background: '#FAFAF7',
  cardBg: '#ECF0FF',
  text: '#13132E',
  accent: '#2244BB',
};

const testimonialQuotes: QuoteWithUrl[] = [
  {
    quote: '"We should not underestimate the real threats coming from AI [while] we have a narrowing window of opportunity to guide this technology responsibly."', // 156 chars
    name: 'Ursula von der Leyen',
    role: 'President, European Commission',
    imageSrc: '/images/agi-strategy/ursula.png',
    url: 'https://neighbourhood-enlargement.ec.europa.eu/news/2023-state-union-address-president-von-der-leyen-2023-09-13_en',
  },
  {
    quote: '"I\'ve always thought of AI as the most profound technology humanity is working on. More profound than fire or electricity or anything that we\'ve done in the past… The downside is, at some point, that humanity loses control of the technology it\'s developing."',
    name: 'Sundar Pichai',
    role: 'CEO, Google',
    imageSrc: '/images/agi-strategy/sundar.jpg',
    url: 'https://garrisonlovely.substack.com/p/a-compilation-of-tech-executives',
  },
  {
    quote: '"AI could surpass almost all humans at almost everything shortly after 2027."',
    name: 'Dario Amodei',
    role: 'CEO, Anthropic',
    imageSrc: '/images/lander/foai/dario.jpeg',
    url: 'https://arstechnica.com/ai/2025/01/anthropic-chief-says-ai-could-surpass-almost-all-humans-at-almost-everything-shortly-after-2027/',
  },
  {
    quote: '"I\'m all in favor of accelerating technological progress, but there is something unsettling about the way OpenAI explicitly declares its mission to be the creation of AGI. AI is a wonderful tool for the betterment of humanity; AGI is a potential successor species … To the extent the mission produces extra motivation for the team to ship good products, it\'s a positive. To the extent it might actually succeed, it\'s a reason for concern."',
    name: 'David Sacks',
    role: 'White House AI and Crypto Czar',
    imageSrc: '/images/agi-strategy/david-sacks.jpg',
    url: 'https://x.com/HumanHarlan/status/1864858286065111298',
  },
];

// Font sizing configuration
const FONT_SIZE_THRESHOLDS = {
  EXTRA_LONG: 400, // Characters threshold for smallest font
  LONG: 200, // Characters threshold for medium font
} as const;

const FONT_SIZE_CLASSES = {
  EXTRA_LONG: 'text-[12px] sm:text-[14px] min-[680px]:text-[16px] lg:text-[16px] xl:text-[20px]', // For quotes > 400 chars
  LONG: 'text-[16px] sm:text-[18px] min-[680px]:text-[20px] lg:text-[20px] xl:text-[24px]', // For quotes 200-400 chars
  DEFAULT: 'text-[20px] min-[680px]:text-[24px] lg:text-[28px] xl:text-[32px]', // For quotes < 200 chars
} as const;

// Automatically determine font size based on quote length
const getFontSizeForQuote = (quote: string): string => {
  const { length } = quote;

  if (length > FONT_SIZE_THRESHOLDS.EXTRA_LONG) {
    return FONT_SIZE_CLASSES.EXTRA_LONG;
  } if (length > FONT_SIZE_THRESHOLDS.LONG) {
    return FONT_SIZE_CLASSES.LONG;
  }
  return FONT_SIZE_CLASSES.DEFAULT;
};

// QuoteCard Component - Reusable card structure
const QuoteCard = ({ quote, isActive = true, onClick }: {
  quote: QuoteWithUrl;
  isActive?: boolean;
  onClick?: () => void;
}) => {
  const cardContent = (
    <div className="flex flex-col lg:flex-row-reverse w-full h-[465px] min-[680px]:!h-[377px] lg:h-[385px]">
      {/* Quote and author info */}
      <div className="flex flex-col items-center lg:items-start py-8 px-6 min-[680px]:!py-8 min-[680px]:!px-6 lg:!p-16 gap-6 sm:gap-8 min-[680px]:gap-12 flex-grow justify-between">
        {/* Quote text - sizing automatically determined by content length */}
        <blockquote
          className={`${getFontSizeForQuote(quote.quote)} leading-normal lg:leading-tight font-semibold text-center lg:text-left`}
          style={{ color: COLORS.text }}
        >
          {quote.quote}
        </blockquote>

        {/* Author info container */}
        <div className="flex flex-col items-center lg:items-start gap-4 lg:gap-0">
          {/* Avatar - mobile only */}
          {quote.url && isActive ? (
            <a href={quote.url} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
              <img
                src={quote.imageSrc}
                alt={quote.name}
                className="size-12 sm:size-16 object-cover rounded-full lg:hidden"
              />
            </a>
          ) : (
            <img
              src={quote.imageSrc}
              alt={quote.name}
              className="size-12 sm:size-16 object-cover rounded-full lg:hidden"
            />
          )}

          {/* Name and role */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="text-[18px] leading-tight font-semibold" style={{ color: COLORS.text }}>
              {quote.name}
            </div>
            <div className="text-[16px] leading-[1.6] opacity-80 text-center lg:text-left lg:px-0" style={{ color: COLORS.text }}>
              {quote.role}
            </div>
          </div>
        </div>
      </div>

      {/* Large image - desktop only with left-side rounded corners */}
      <div className="hidden lg:block w-80 h-[385px] flex-shrink-0 overflow-hidden rounded-l-xl">
        {quote.url && isActive ? (
          <a
            href={quote.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block size-full cursor-pointer"
          >
            <img
              src={quote.imageSrc}
              alt={quote.name}
              className="size-full object-cover rounded-l-xl"
            />
          </a>
        ) : (
          <img
            src={quote.imageSrc}
            alt={quote.name}
            className="size-full object-cover rounded-l-xl"
          />
        )}
      </div>
    </div>
  );

  if (onClick && !isActive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full cursor-pointer rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2244BB]"
        style={{ backgroundColor: COLORS.cardBg }}
        aria-label="Go to next quote"
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div
      className="w-full rounded-xl overflow-hidden"
      style={{ backgroundColor: COLORS.cardBg }}
    >
      {cardContent}
    </div>
  );
};

const QuoteSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const autorotateTiming = 11000;
  const isDesktop = useAboveBreakpoint(680); // 680px is the design breakpoint specified

  // Single effect that handles all timer logic
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % testimonialQuotes.length);
      }, autorotateTiming);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeIndex, isPaused]);

  const handleIndicatorClick = (index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const handleFocusCapture = () => {
    setIsPaused(true);
  };

  const handleBlurCapture = (e: React.FocusEvent<HTMLElement>) => {
    // Only unpause if focus is leaving the entire section
    const nextFocusedNode = e.relatedTarget instanceof Node ? e.relatedTarget : null;

    if (!nextFocusedNode || !e.currentTarget.contains(nextFocusedNode)) {
      setIsPaused(false);
    }
  };

  const handlePrevious = useCallback(() => {
    setActiveIndex((prevIndex) => (prevIndex === 0 ? testimonialQuotes.length - 1 : prevIndex - 1));
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonialQuotes.length);
  }, []);

  // Touch/swipe handling for mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX ?? null;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const activeQuote = testimonialQuotes[activeIndex];
  const nextQuote = testimonialQuotes[(activeIndex + 1) % testimonialQuotes.length];

  if (!activeQuote) {
    return null;
  }

  return (
    <section
      className="relative w-full py-6 px-5 sm:py-6 sm:px-5 min-[680px]:py-6 min-[680px]:px-5 lg:p-12 overflow-x-hidden"
      style={{ backgroundColor: COLORS.background }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Quote carousel"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Main content container */}
      <div className="flex flex-col items-center gap-8 w-full max-w-[calc(100vw-40px)] min-[680px]:max-w-none min-[680px]:w-[calc(100vw-64px)] lg:w-auto lg:max-w-none mx-auto overflow-visible">
        {/* Quote cards container */}
        <div className="relative w-full">
          {/* Mobile and Tablet layout with peek effect (below 1024px) */}
          <div className="lg:hidden relative">
            {/* Main quote card - centered */}
            <div className="flex justify-center w-full">
              <div className="w-[calc(100vw-40px)] min-[680px]:w-[calc(100vw-64px)] relative z-10">
                <QuoteCard quote={activeQuote} isActive />
              </div>
            </div>

            {/* Peek card positioned absolutely with consistent 10px gap */}
            {nextQuote && (
              <>
                {/* Mobile peek card (below 680px) */}
                <div className="min-[680px]:hidden absolute top-0 left-1/2 pointer-events-none">
                  <div className="relative pointer-events-auto" style={{ left: 'calc((100vw - 40px) / 2 + 10px)' }}>
                    <div className="w-[calc(100vw-40px)]">
                      <QuoteCard quote={nextQuote} isActive={false} onClick={handleNext} />
                    </div>
                  </div>
                </div>

                {/* Tablet peek card (680px-1023px) */}
                <div className="hidden min-[680px]:block lg:hidden absolute top-0 pointer-events-none" style={{ left: 'calc(50% + (100vw - 64px) / 2 + 10px)' }}>
                  <div className="w-[calc(100vw-64px)] pointer-events-auto">
                    <QuoteCard quote={nextQuote} isActive={false} onClick={handleNext} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Desktop layout with peek effect (1024px+) */}
          <div className="hidden lg:block relative">
            {/* Main quote card - centered */}
            <div className="flex justify-center w-full">
              <div className="lg:w-[928px] xl:w-[1120px] relative z-10">
                <QuoteCard quote={activeQuote} isActive />
              </div>
            </div>

            {/* Peek card - absolutely positioned for full-bleed effect */}
            {nextQuote && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Peek card for lg screens (1024px) */}
                <div
                  className="absolute top-0 pointer-events-auto hidden lg:block xl:hidden"
                  style={{
                    left: 'calc(50% + 496px)', // 50% center + 464px (half of 928px card) + 32px gap
                  }}
                >
                  <div className="w-[928px]">
                    <QuoteCard quote={nextQuote} isActive={false} onClick={handleNext} />
                  </div>
                </div>

                {/* Peek card for xl screens (1280px+) */}
                <div
                  className="absolute top-0 pointer-events-auto hidden xl:block"
                  style={{
                    left: 'calc(50% + 592px)', // 50% center + 560px (half of 1120px card) + 32px gap
                  }}
                >
                  <div className="w-[1120px]">
                    <QuoteCard quote={nextQuote} isActive={false} onClick={handleNext} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation controls - Match 680px Figma specs exactly */}
        <div className="flex items-center justify-center w-[calc(100vw-40px)] min-[680px]:gap-8 min-[680px]:w-[calc(100vw-64px)] lg:w-[928px] lg:h-[38px] lg:gap-8 relative z-10">
          {/* Left arrow - Shows at 680px+ matching CommunityMembersSubSection */}
          {isDesktop && (
            <button
              type="button"
              onClick={handlePrevious}
              className="size-12 rounded-full flex items-center justify-center bg-[rgba(19,19,46,0.08)] transition-all duration-200 opacity-80 hover:opacity-100 hover:bg-[rgba(19,19,46,0.15)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2244BB]"
              aria-label="Previous quote"
            >
              <span
                className="text-[#13132E] text-[22.4px] font-medium select-none"
                style={{
                  transform: 'scaleX(-1)',
                }}
              >
                →
              </span>
            </button>
          )}

          {/* Selector container - Mobile: 280px width, 64px indicators | Desktop: 408px width, 96px indicators */}
          <div className="flex gap-2 w-[280px] h-[38px] min-[680px]:w-[408px] min-[680px]:h-[38px] lg:w-[408px] lg:h-[38px]">
            {testimonialQuotes.map((quote, index) => (
              <button
                type="button"
                key={`indicator-${quote.name}`}
                onClick={() => handleIndicatorClick(index)}
                className="flex-1 py-4 h-[38px] min-[680px]:flex-none min-[680px]:w-24 min-[680px]:h-[38px] lg:w-24 lg:h-[38px] cursor-pointer transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2244BB]"
                aria-label={`Go to quote ${index + 1}`}
              >
                <div
                  className="w-full min-[680px]:w-24 h-1.5 rounded transition-all duration-300"
                  style={{
                    backgroundColor: index === activeIndex ? COLORS.accent : COLORS.text,
                    opacity: index === activeIndex ? 1 : 0.15,
                  }}
                />
              </button>
            ))}
          </div>

          {/* Right arrow - Shows at 680px+ matching CommunityMembersSubSection */}
          {isDesktop && (
            <button
              type="button"
              onClick={handleNext}
              className="size-12 rounded-full flex items-center justify-center bg-[rgba(19,19,46,0.08)] transition-all duration-200 opacity-80 hover:opacity-100 hover:bg-[rgba(19,19,46,0.15)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2244BB]"
              aria-label="Next quote"
            >
              <span
                className="text-[#13132E] text-[22.4px] font-medium select-none"
              >
                →
              </span>
            </button>
          )}
        </div>
      </div>

    </section>
  );
};

export default QuoteSection;
