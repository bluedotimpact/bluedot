import {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { Quote } from '@bluedot/ui';
import { useAboveBreakpoint } from '@bluedot/ui/src/hooks/useBreakpoint';

export type QuoteWithUrl = Quote & {
  /** Source URL for the quote */
  url: string;
  /** Role/title of the person being quoted - required for lander quotes */
  role: string;
};

export type QuoteSectionProps = {
  /** Array of quotes to display in the carousel */
  quotes: QuoteWithUrl[];
  /** Background color for the quote card. Defaults to '#ECF0FF' */
  cardBackgroundColor?: string;
  /** Accent color for the active navigation indicator. Defaults to bluedot-normal */
  accentColor?: string;
};

// Design constants - these stay consistent across all courses
const DEFAULT_COLORS = {
  background: '#FFFFFF',
  cardBg: '#ECF0FF',
  text: '#13132E',
  accent: 'var(--bluedot-normal)',
};

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

const QuoteCard = ({ quote, isActive = true, cardBackgroundColor }: {
  quote: QuoteWithUrl;
  isActive?: boolean;
  cardBackgroundColor?: string;
}) => {
  const cardContent = (
    <div className="flex flex-col lg:flex-row-reverse w-full h-[465px] min-[680px]:!h-[377px] lg:h-[385px]">
      {/* Quote and author info */}
      <div className="flex flex-col items-center lg:items-start py-8 px-6 min-[680px]:!py-8 min-[680px]:!px-6 lg:!p-16 gap-6 sm:gap-8 min-[680px]:gap-12 flex-grow justify-between">
        {/* Quote text - sizing automatically determined by content length */}
        <blockquote
          className={`${getFontSizeForQuote(quote.quote)} leading-normal lg:leading-tight font-semibold text-center lg:text-left`}
          style={{ color: DEFAULT_COLORS.text }}
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
            <div className="text-[18px] leading-tight font-semibold" style={{ color: DEFAULT_COLORS.text }}>
              {quote.name}
            </div>
            <div className="text-[16px] leading-[1.6] opacity-80 text-center lg:text-left lg:px-0" style={{ color: DEFAULT_COLORS.text }}>
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

  return (
    <div
      className="w-full rounded-xl overflow-hidden"
      style={{ backgroundColor: cardBackgroundColor || DEFAULT_COLORS.cardBg }}
    >
      {cardContent}
    </div>
  );
};

const QuoteSection = ({ quotes, cardBackgroundColor, accentColor }: QuoteSectionProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const autorotateTiming = 11000; // Design constant
  const isDesktop = useAboveBreakpoint(680); // 680px is the design breakpoint specified

  // Single effect that handles all timer logic
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % quotes.length);
      }, autorotateTiming);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeIndex, isPaused, quotes.length]);

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
    setActiveIndex((prevIndex) => (prevIndex === 0 ? quotes.length - 1 : prevIndex - 1));
  }, [quotes.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % quotes.length);
  }, [quotes.length]);

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

  const activeQuote = quotes[activeIndex];

  if (!activeQuote) {
    return null;
  }

  return (
    <section
      className="relative w-full py-6 px-5 sm:px-5 min-[680px]:pt-8 min-[680px]:pb-16 min-[680px]:px-8 lg:p-12 xl:pb-24 overflow-x-hidden"
      style={{ backgroundColor: DEFAULT_COLORS.background }}
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
          {/* Mobile and Tablet layout (below 1024px) */}
          <div className="lg:hidden relative">
            {/* Main quote card - centered */}
            <div className="flex justify-center w-full">
              <div className="w-[calc(100vw-40px)] min-[680px]:w-[calc(100vw-64px)] relative z-10">
                <QuoteCard quote={activeQuote} isActive cardBackgroundColor={cardBackgroundColor} />
              </div>
            </div>
          </div>

          {/* Desktop layout (1024px+) */}
          <div className="hidden lg:block relative">
            {/* Main quote card - centered */}
            <div className="flex justify-center w-full">
              <div className="lg:w-[928px] xl:w-[1120px] relative z-10">
                <QuoteCard quote={activeQuote} isActive cardBackgroundColor={cardBackgroundColor} />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation controls - Match 680px Figma specs exactly */}
        <div className="flex items-center justify-center w-[calc(100vw-40px)] min-[680px]:gap-8 min-[680px]:w-[calc(100vw-64px)] lg:w-[928px] lg:h-[38px] lg:gap-8 relative z-10">
          {isDesktop && (
            <button
              type="button"
              onClick={handlePrevious}
              className="size-12 rounded-full flex items-center justify-center bg-[rgba(19,19,46,0.08)] transition-all duration-200 opacity-80 hover:opacity-100 hover:bg-[rgba(19,19,46,0.15)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-bluedot-normal"
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
            {quotes.map((quote, index) => (
              <button
                type="button"
                key={`indicator-${quote.name}`}
                onClick={() => handleIndicatorClick(index)}
                className="flex-1 py-4 h-[38px] min-[680px]:flex-none min-[680px]:w-24 min-[680px]:h-[38px] lg:w-24 lg:h-[38px] cursor-pointer transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-bluedot-normal"
                aria-label={`Go to quote ${index + 1}`}
              >
                <div
                  className="w-full min-[680px]:w-24 h-1.5 rounded transition-all duration-300"
                  style={{
                    backgroundColor: index === activeIndex ? (accentColor || DEFAULT_COLORS.accent) : DEFAULT_COLORS.text,
                    opacity: index === activeIndex ? 1 : 0.15,
                  }}
                />
              </button>
            ))}
          </div>

          {isDesktop && (
            <button
              type="button"
              onClick={handleNext}
              className="size-12 rounded-full flex items-center justify-center bg-[rgba(19,19,46,0.08)] transition-all duration-200 opacity-80 hover:opacity-100 hover:bg-[rgba(19,19,46,0.15)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-bluedot-normal"
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
